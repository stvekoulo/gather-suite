import { describe, expect, it } from "vitest";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { handleRpc } from "./mcp-server";

const rpc = (method: string, params?: object) => JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
type Reply = { result?: { tools?: { name: string }[]; isError?: boolean; content?: { text: string }[]; protocolVersion?: string }; error?: { code: number } };
const call = async (name: string, args: object, allowWrite = true) => {
  const reply = (await handleRpc(rpc("tools/call", { name, arguments: args }), { allowWrite })) as Reply;
  return { isError: reply.result?.isError, text: reply.result?.content?.[0].text ?? "", json: () => JSON.parse(reply.result!.content![0].text) };
};

describe("MCP server", () => {
  it("negotiates the protocol and ignores notifications", async () => {
    expect(((await handleRpc(rpc("initialize", { protocolVersion: "2025-03-26" }), { allowWrite: false })) as Reply).result?.protocolVersion).toBe("2025-03-26");
    expect(await handleRpc(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }), { allowWrite: false })).toBeNull();
    expect(((await handleRpc("not json", { allowWrite: false })) as Reply).error?.code).toBe(-32700);
    expect(((await handleRpc(rpc("nope"), { allowWrite: false })) as Reply).error?.code).toBe(-32601);
  });
  it("read-only mode hides and refuses every write tool", async () => {
    const names = ((await handleRpc(rpc("tools/list"), { allowWrite: false })) as Reply).result!.tools!.map((t) => t.name);
    expect(names).toContain("search");
    expect(names).not.toContain("create_note");
    const before = useBlinkoStore.getState().notes.length;
    expect((await call("create_note", { content: "x" }, false)).isError).toBe(true);
    expect(useBlinkoStore.getState().notes.length).toBe(before);
  });
  it("agents act on the same live data as the interface", async () => {
    const note = (await call("create_note", { content: "Agent note Kestrel", title: "Kestrel" })).json();
    expect(useBlinkoStore.getState().notes.some((n) => n.id === note.id)).toBe(true);
    const found = (await call("search", { query: "kestrel" })).json();
    expect(found[0].id).toBe(note.id);
    const task = (await call("create_task", { title: "Agent task", due_date: "2026-01-01" })).json();
    await call("update_task", { id: task.id, status: "done" });
    expect(useWorkspaceStore.getState().tasks.find((t) => t.id === task.id)?.status).toBe("done");
    const invoice = (await call("create_invoice", { client: "Acme", currency: "usd", tax_rate: 20, items: [{ description: "Audit", quantity: 2, rate: 100 }] })).json();
    expect(invoice.total).toBe(240);
    expect(invoice.status).toBe("draft");
    expect(useAppStore.getState().events.some((e) => e.requestId === `inv-${invoice.id}`)).toBe(true);
    const event = (await call("create_event", { title: "RDV", date: "2026-06-01", start: "09:30" })).json();
    expect([event.start, event.end, event.allDay]).toEqual([570, 630, false]);
  });
  it("rejects bad input with a usable message and changes nothing", async () => {
    const before = useAppStore.getState().financeTransactions.length;
    expect((await call("add_transaction", { type: "expense", title: "x", amount: -1, category: "y" })).text).toContain("above 0");
    expect((await call("create_event", { title: "x", date: "demain" })).text).toContain("YYYY-MM-DD");
    expect((await call("get", { collection: "notes", id: "absent" })).isError).toBe(true);
    expect((await call("list", { collection: "secrets" })).isError).toBe(true);
    expect(useAppStore.getState().financeTransactions.length).toBe(before);
  });
  it("never hands file contents to an agent", async () => {
    useAppStore.getState().addDocument({ name: "secret.pdf", category: "Autre", size: 1, dataUrl: "data:application/pdf;base64," + "A".repeat(5000) });
    expect((await call("list", { collection: "documents" })).text).not.toContain("AAAA");
  });
});
