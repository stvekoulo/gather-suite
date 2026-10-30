"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { savedRoute } from "@/components/shell/last-route";

export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace(savedRoute()); }, [router]);
  return null;
}
