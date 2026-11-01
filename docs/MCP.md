# Connect an AI agent (MCP)

Gather exposes an MCP server so that Claude, Cursor or any other MCP client can act on your data. Turn it on in Settings > Data. It only works in the desktop app, while the app is open.

## Security

- Off by default, then **read-only**: changes need a second switch.
- Listens only on `127.0.0.1:47821`, with an access token you can change at any time.
- Refuses any request with an `Origin` header, so a web page cannot reach it.
- Never sends the content of attached files, only their details.
- Acts on the active space. Content it reads may contain malicious instructions, so only allow writing for agents you trust.

## Connecting

The **Copy configuration** button gives you the block to paste into the client, through `mcp-remote`. Clients that support HTTP directly use `http://127.0.0.1:47821/mcp` and the header `Authorization: Bearer TOKEN`.

Hosted agents (OpenAI API, Grok) cannot reach a local server without an HTTPS tunnel. A remote MCP server backed by the cloud account has yet to be built for them.

## Tools

- **Read:** `search`, `today`, `list`, `get`, `finance_summary`, `convert_currency`, `client_activity`, `list_clients`, `list_spaces`.
- **Write:** notes, tasks, events, invoices (draft and status), finances, time, timer, clients, documents, spreadsheets, presentations, switching space.
- **Not included:** PDF processing, editing an existing document or spreadsheet.

No tool sends a message or an invoice to a third party.
