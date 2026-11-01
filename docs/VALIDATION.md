# Gather: validation results

Results obtained on this Windows machine unless stated otherwise. A missing line means it was not checked. Last updated November 1, 2026.

## Checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | 0 errors, 69 warnings (unused imports and `<img>`) |
| `npm test` | 115 tests pass, 32 files |
| `npm run build` | Pass |
| `e2e/english.spec.ts` | All 16 pages show no detected French text in English mode, with empty data |
| `cargo check` and Tauri QA build | Pass |
| `npm run test:native` (QA executable) | Whiteboard, PDF reader, OCR start, online rates, Neon Auth access, blocking an unauthorized domain, persistence after restart |
| MCP server (QA executable) | Without token: 401. From a web page: 403. 30 tools listed; a task created by an external client appears in the app |
| VPS build on Openship (run 9, 1 h 12) | Tests pass in the container; `v0.3.0` Linux and Windows published. macOS skipped because `osxcross` was missing from the VPS |
| VPS build on Openship (run 12, 1 h 37) | `v0.3.1`: Linux, Windows, macOS Apple Silicon and Intel. macOS binaries checked as Mach-O, arm64 with a local signature |
| VPS build on Openship (run 13, 1 h 45) | `v0.3.2` signed for updates: `latest.json` covers Linux, Windows and both macOS architectures, and its four links respond. Signature key ID compared with the app's public key. Installing an update has never been tried |
| Linux `.deb` and AppImage `v0.3.2` (clean Ubuntu 22.04 container on the VPS, virtual display) | Downloaded from GitHub; `.deb` installs; both open a `Gather` window and stay running. With the `.deb`, the welcome screen renders and `workspace.db` is created. Not tried on a physical machine |
| `next build` of the landing page | Pass; download links active. Site not deployed |
| `npm audit --omit=dev` | 4 low vulnerabilities, none moderate or higher |
| Account isolation (SQL on Neon) | Another account sees nothing, changes nothing, cannot write on someone else's behalf; without a token, no rows |

The Neon Data API was not enabled (a 503 error on sync). It has been since October 31. Enable it before applying `cloud/schema.sql`, which no longer creates the `authenticated` role.

Sync is covered by merge engine tests and an E2E journey with a simulated server.

## Not checked

- **Sync with a real Neon account:** no real sign-up was made during these tests. To do with an account on two computers.
- System tray, the global `Ctrl+Shift+Space` shortcut and launch at startup: compiled, not tried by hand.
- macOS: nothing has been launched on a Mac. The macOS SDK comes from a third-party archive (`joseluisq/macosx-sdks`, SHA-256 `6e146275d19f027faa2e8354da5e0267513abf013b8f16ad65a231653a2b1c5d`).
- A clean Windows machine, or one without WebView2.
- Task drag and drop: tested in a browser, not in the installed app.
- PDF digital signature checked with OpenSSL or Adobe.
- GitHub CI: refused because of a billing issue, so releases go through the VPS.

## Reproduce

```sh
npm run build
npm run test:e2e
npm run tauri:build -- --debug --no-bundle --config src-tauri/tauri.qa.conf.json
npm run test:native -- ABSOLUTE_PATH_TO_EXE
```

`test:native` refuses to run outside the `app.stevenkoulo.gather.qa` profile.
