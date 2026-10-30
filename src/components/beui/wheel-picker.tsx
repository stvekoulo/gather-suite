"use client";

import { useReducedMotion } from "motion/react";
import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import { createTickPlayer } from "@/lib/tick-sound";
import { capturePointer, releasePointer, TOUCH_GESTURE_CLASS } from "@/lib/touch";
import { cn } from "@/lib/utils";
import {
  calculateReleaseVelocity,
  clamp,
  DECELERATION,
  easeOutBack,
  easeOutCubic,
  useWheelGeometry,
  WHEEL_SENS,
  WHEEL_SETTLE,
} from "./wheel-picker-physics";
import { type WheelPickerProps, optionLabel, optionValue } from "./wheel-picker-types";

export type { WheelPickerOption, WheelPickerProps } from "./wheel-picker-types";

// Composant WheelPicker style iOS beUI animé avec tambour 3D, inertie et clic mécanique
export function WheelPicker({
  options,
  value,
  defaultValue,
  onValueChange,
  visibleCount = 5,
  itemHeight = 36,
  disabled = false,
  sound = true,
  className,
  "aria-label": ariaLabel,
}: WheelPickerProps) {
  const reduce = useReducedMotion() ?? false;
  const controlled = value !== undefined;
  const last = options.length - 1;

  const indexOf = useCallback((v: string | undefined) => {
    const i = options.findIndex((o) => optionValue(o) === v);
    return i < 0 ? 0 : i;
  }, [options]);

  const [internal, setInternal] = useState(() => defaultValue ?? value);
  const currentValue = controlled ? value : internal;
  const [grabbing, setGrabbing] = useState(false);
  const { itemAngle, radius, height, hideBeyond } = useWheelGeometry(visibleCount, itemHeight);

  const container = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLUListElement>(null);
  const bandRef = useRef<HTMLUListElement>(null);
  const scroll = useRef(indexOf(currentValue));
  const raf = useRef(0);
  const emitted = useRef(currentValue);
  const tickPlayer = useRef<ReturnType<typeof createTickPlayer> | null>(null);
  const lastTick = useRef(indexOf(currentValue));

  const getPlayer = useCallback(() => {
    if (!tickPlayer.current) tickPlayer.current = createTickPlayer();
    return tickPlayer.current;
  }, []);

  const maybeTick = useCallback((pos: number) => {
    const row = clamp(Math.round(pos), 0, last);
    if (!sound || reduce || row === lastTick.current) return;
    lastTick.current = row;
    getPlayer().play();
  }, [sound, reduce, last, getPlayer]);

  const paint = useCallback((s: number) => {
    for (const el of [drumRef.current, bandRef.current]) {
      if (!el) continue;
      el.style.transform = `translateZ(${-radius}px) rotateX(${itemAngle * s}deg)`;
      for (const node of Array.from(el.children)) {
        const li = node as HTMLLIElement;
        const want = Math.abs(Number(li.dataset.index) - s) > hideBeyond ? "hidden" : "visible";
        if (li.style.visibility !== want) li.style.visibility = want;
      }
    }
  }, [radius, itemAngle, hideBeyond]);

  const emit = useCallback((i: number) => {
    const v = optionValue(options[clamp(i, 0, last)]);
    if (v === emitted.current) return;
    emitted.current = v;
    if (sound && reduce) getPlayer().play();
    if (!controlled) setInternal(v);
    onValueChange?.(v);
  }, [options, last, controlled, onValueChange, sound, reduce, getPlayer]);

  const stop = useCallback(() => cancelAnimationFrame(raf.current), []);

  const glide = useCallback((to: number, duration: number, ease: (p: number) => number = easeOutCubic) => {
    stop();
    const from = scroll.current;
    const dist = to - from;
    if (!dist || duration <= 0) {
      scroll.current = to;
      paint(to);
      maybeTick(to);
      emit(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const p = (now - start) / duration;
      if (p >= 1) {
        scroll.current = to;
        paint(to);
        maybeTick(to);
        emit(to);
        return;
      }
      scroll.current = from + dist * ease(p);
      paint(scroll.current);
      maybeTick(scroll.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [stop, paint, emit, maybeTick]);

  const fling = useCallback((velocity: number) => {
    const from = scroll.current;
    if (from < 0 || from > last) {
      glide(clamp(Math.round(from), 0, last), 260);
      return;
    }
    const coast = ((velocity * velocity) / (2 * DECELERATION)) * Math.sign(velocity);
    const to = clamp(Math.round(from + coast), 0, last);
    const duration = clamp(Math.sqrt(Math.abs(to - from)) * 300 + 240, 280, 1700);
    glide(to, duration, easeOutBack);
  }, [glide, last]);

  const drag = useRef<{ y: number; scroll: number; pts: [number, number][] } | null>(null);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (disabled || reduce || e.pointerType === "touch") return;
    stop();
    if (sound) getPlayer().prepare();
    setGrabbing(true);
    drag.current = { y: e.clientY, scroll: scroll.current, pts: [[e.clientY, performance.now()]] };
    capturePointer(e.currentTarget, e.pointerId);
  }, [disabled, reduce, stop, sound, getPlayer]);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    d.pts.push([e.clientY, performance.now()]);
    if (d.pts.length > 8) d.pts.shift();
    let next = d.scroll + (d.y - e.clientY) / itemHeight;
    if (next < 0) next *= 0.3;
    else if (next > last) next = last + (next - last) * 0.3;
    scroll.current = next;
    paint(next);
    maybeTick(next);
    emit(Math.round(clamp(next, 0, last)));
  }, [itemHeight, last, paint, emit, maybeTick]);

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setGrabbing(false);
    releasePointer(e.currentTarget, e.pointerId);
    fling(calculateReleaseVelocity(d.pts, itemHeight));
  }, [itemHeight, fling]);

  const wheelSnap = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    if (disabled || reduce) return;
    if (sound) getPlayer().prepare();
    stop();
    const px = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    const next = clamp(scroll.current + px * WHEEL_SENS, 0, last);
    scroll.current = next;
    paint(next);
    maybeTick(next);
    emit(Math.round(next));
    if (wheelSnap.current) clearTimeout(wheelSnap.current);
    wheelSnap.current = setTimeout(() => glide(clamp(Math.round(scroll.current), 0, last), 240, easeOutBack), WHEEL_SETTLE);
  }, [disabled, reduce, sound, last, paint, emit, stop, glide, maybeTick, getPlayer]);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const at = Math.round(scroll.current);
    if (sound) getPlayer().prepare();
    if (e.key === "ArrowUp") { e.preventDefault(); glide(clamp(at - 1, 0, last), 240, easeOutBack); }
    else if (e.key === "ArrowDown") { e.preventDefault(); glide(clamp(at + 1, 0, last), 240, easeOutBack); }
  }, [disabled, last, glide, sound, getPlayer]);

  useEffect(() => {
    const target = indexOf(currentValue);
    emitted.current = currentValue;
    if (Math.abs(Math.round(scroll.current) - target) < 0.001) { paint(scroll.current); return; }
    glide(target, 260);
  }, [currentValue, indexOf, paint, glide]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    if (wheelSnap.current) clearTimeout(wheelSnap.current);
    tickPlayer.current?.dispose();
  }, []);

  return (
    <div
      ref={container}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      className={cn(
        "relative touch-none overflow-hidden rounded-xl border border-hairline bg-surface select-none outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        TOUCH_GESTURE_CLASS,
        grabbing ? "cursor-grabbing" : "cursor-grab",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      style={{ height, perspective: 1000 }}
    >
      <ul ref={drumRef} aria-hidden className="absolute inset-x-0 top-1/2 m-0 h-0 list-none p-0 [backface-visibility:hidden] [transform-style:preserve-3d]">
        {options.map((option, i) => (
          <li
            key={optionValue(option)}
            data-index={i}
            className="absolute inset-x-0 flex items-center justify-center text-xs font-medium text-fg-2 transition-colors"
            style={{ top: -itemHeight / 2, height: itemHeight, transform: `rotateX(${-itemAngle * i}deg) translateZ(${radius}px)` }}
          >
            {optionLabel(option)}
          </li>
        ))}
      </ul>
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 overflow-hidden border-y border-brand/30 bg-brand-tint/25 dark:bg-brand/15 shadow-xs"
        style={{ height: itemHeight, perspective: 1000 }}
      >
        <ul ref={bandRef} aria-hidden className="absolute inset-x-0 top-1/2 m-0 h-0 list-none p-0 [backface-visibility:hidden] [transform-style:preserve-3d]">
          {options.map((option, i) => (
            <li
              key={optionValue(option)}
              data-index={i}
              className="absolute inset-x-0 flex items-center justify-center text-xs font-bold text-fg tabular-nums"
              style={{ top: -itemHeight / 2, height: itemHeight, transform: `rotateX(${-itemAngle * i}deg) translateZ(${radius}px)` }}
            >
              {optionLabel(option)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
