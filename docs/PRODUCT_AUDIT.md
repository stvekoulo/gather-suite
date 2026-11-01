# Gather Suite: functional audit and validation

Product author: **Steven KOULO**. Written October 31, 2026, updated November 1, 2026.

Status: **advanced beta on Windows, incomplete feature parity**. Results are in [VALIDATION.md](./VALIDATION.md).

## Readiness verdict

| Intended use | Verdict | Reason |
| --- | --- | --- |
| Personal local use on Windows | Yes | Build, unit tests and E2E journeys pass, with snapshots and recovery |
| Account and sync | To validate | Isolation proven in SQL and merging tested; never tried with a real account on two PCs |
| Full replacement for Word/PowerPoint, Blinko or Stirling-PDF | No | See [PARITY_NON_AI.md](./PARITY_NON_AI.md) |
| Public distribution | Not yet | Unsigned installers, automatic update never tried end to end, macOS untested |

## References analyzed

The `reverse-engineer-anything` skill was read. It prescribes ordinary repository tools for complete sources, so no binary needed decompiling. Reference clones are isolated in `.reference/`, outside the build.

- Blinko: `stvekoulo/blinko`, revision `b2586d03fddb796252f050a96922879bf4a41fad`. Analyzed `prisma/schema.prisma`, `server/routerTrpc/note.ts`, `tag.ts`, `attachment.ts`, `server/jobs/dbjob.ts`, and the editors, resources and settings.
- Excalidraw: revision `e7b534668a60add7f725531f3c9abf32508c7b4e`. Analyzed the README catalog, `packages/excalidraw/data/json.ts`, `library.ts`, the actions, and the separate `excalidraw-app/collab/Collab.tsx` layer. The embedded component is `@excalidraw/excalidraw@0.18.1`, not a copy of the whole hosted app, and not a guarantee of equivalence with the reference revision.
- Stirling-PDF: revision `025f763f015243327d0de9079403c0436a8504e2`. Analyzed the frontend tool catalog and the backend's OCR, conversion, compression and security controllers. `OCRController` depends on OCRmyPDF/Tesseract, and `ConvertPDFToOffice` delegates to a conversion service or LibreOffice. No Stirling-PDF backend is embedded in Gather.

Blinko and Stirling-PDF code was not copied into Gather's modules. They serve here as functional references. The Excalidraw engine is a dependency.

## Defects reproduced and fixed

- PDF operations reported success after a delay without processing any file.
- The PDF reader showed a fake four-page document.
- A created document only saved its metadata, and its text was lost.
- The Word export was Markdown renamed to `.doc`.
- Files imported above 1.5 MB lost their content.
- The Presentations screen was empty on first launch, with no way to create anything.
- IDs based only on the time collided during fast additions.
- Deleting the last slide produced an unusable deck.
- A reopened leave request did not recreate its events.
- Starting a second timer erased the active session.
- Tags removed from content stayed attached to notes, and references were duplicated.
- The settings export left out notes and the other studios' data.
- Palette preferences did not change all the CSS variables in use.
- The calendar started on a fixed demo date.
- The custom CSS loader crashed Turbopack; it was replaced by PostCSS.
- On Windows, the Next.js export produced some RSC segments in subfolders while the router asked for a flattened name. A postbuild step adds the expected paths. The local server must also serve `.txt` with a correct `text/plain` type.
- The native window required a 960 px minimum. It now goes down to 360 × 480, and its initial size is limited to the monitor's available area. Document margins and toolbars adapt to small windows.
- The profile menu announced a fake sign-out. It now states plainly that the profile is local, without simulating a cloud session.
- Native closing needed a missing window-destroy permission. This was fixed, and the close/restart cycle with SQLite re-read was tested.

## Local features present

### Preference and usability fixes, October 30, 2026

- The language saved in settings now drives navigation, settings and the main labels that used to be hard-coded in English. Switching between French and English and keeping the choice after reload are tested.
- Launching at the root resumes the last valid section, and opening a specific section directly is respected. With no history, the dashboard opens.
- Monochrome palette: shorter label, constrained containers and truncation; swatches adapted to the theme, with blue and emerald lightened in dark mode. The seven palettes are tested at 390 px, and their text on accent meets a 4.5:1 contrast.
- The 15 components with imports use a shared beUI File Upload surface: explicit selection, drag and drop, accepted formats, validation and a selection list for PDF processing. Immediate imports keep the module's own list and show no fake transfer progress.
- The notification test waits for the native response and reports errors. A real send from Gather QA was accepted by the Windows service. Whether a banner actually appears depends on system settings and Do Not Disturb.
- Native Windows controls are on the right, in Minimize/Maximize/Close order, with labels; their position is checked in the QA executable.

Validation of this batch: 48 unit tests, a suite of 24 E2E journeys passed, then one extra targeted journey for refusing a format on drag and drop. Frontend build and Windows QA executable succeeded. These checks do not replace the digital signature journey and the other limits in this audit.

| Area | Present | Limits to keep visible |
| --- | --- | --- |
| Identity | Gather / Gather Suite; author Steven KOULO; proprietary license for original work | Provenance audit needed before any commercial distribution of inherited code |
| Appearance | Black and white by default, light/dark themes, saved palettes | Color presets; no full design-system builder |
| Persistence | SQLite through Tauri; IndexedDB in the browser; atomic catalog holding all spaces and modules; migration of old states; visible errors | JSON catalog and attachments stored separately; in-memory search index |
| Documents | Tiptap editing, sizes/colors, alignment, links, find/replace, page breaks, tables/images; DOCX import; real DOCX export with margins, orientation, headers, footers, pagination and table of contents | The on-screen editor stays a continuous flow; partial DOCX import, advanced Word features and complex object fidelity incomplete |
| Document PDFs | Rich export with automatic pagination, headings, styles, numbered lists, tables, images, links, table of contents, headers and footers | Not a pixel-perfect copy of Word; fonts and some complex merged tables to complete |
| Presentations | Creating decks, themes, titles, lists, metrics, notes; movable and resizable text/shape/image objects; valid PPTX export | Partial PPTX import: masters, groups, charts, animations, fonts and complex objects not fully kept; single-window presenter mode |
| Notes | Markdown memos/notes/tasks; hierarchical tags with parents; references, backlinks, history; comments; attachments and resource manager; bulk actions; journal/review; persistent local reminders; import/export | Protected public sharing, sharing between accounts, federation, plugins and server RSS are absent. Reminders work while Gather and the space are open, and catch up on return. No built-in AI |
| Note import | Markdown, JSON, ZIP, `.bko` containing `bak.json`; reference remapping; archive files | Atypical exports and missing resources are refused; no Memos SQLite import or full migration of Blinko accounts |
| Whiteboard | Official engine: drawing, shapes, arrows, images, zoom, undo, libraries; saving; `.excalidraw`, PNG and SVG import/export | Collaboration, session encryption and Excalidraw.com share links not implemented |
| Linked content | Whiteboard diagram and spreadsheet extract embeddable in the document editor with local updates | No full universal graph yet; no equivalent live embed in all studios |
| PDF studio | Local tools: merge, extract/reorder, remove/reverse, rotate, watermark, optimize, numbering, dimensions, crop, metadata, flatten, flattened text/highlight, images to PDF, PDFs split into a ZIP, text extraction, offline French/English OCR to searchable PDF, PNG per page, rasterized JPEG compression and rasterized redaction | Password protection, interactive annotations, PDF/A, editable forms and faithful Office conversion to complete. The digital signature is covered below. Rasterizing removes selectable text, links and fields; OCR limited to batches of 200 pages |
| PDF digital signature | Detached CMS signature with an RSA key and a PKCS#12 `.p12/.pfx` certificate, password, reason and integrity check through PKIjs/Web Crypto; refuses expired certificates, wrong passwords and a new signature on an already signed PDF | Unit tests and build pass; interface journey, OpenSSL and new native validation still to run. No validation of trust chain/revocation, certified TSA, qualified signature, EC key or incremental successive signatures. The module does not persist the certificate or password |
| Kanban | Projects, statuses, priorities, due dates, subtasks, timer; calendar; data specific to each space | No collaboration between accounts yet |
| Spreadsheet | Saved grid; references, ranges, arithmetic, SUM, AVERAGE, lazy IF, MIN/MAX, COUNT; sort/filter; CSV | 26 columns and 200 rows; no full XLSX import, advanced charts or Airtable-style bases |
| Invoicing | Local editing; PDF; turning hours into lines; protection against double billing | "Sent" is a manual status, not an email; no real payment |
| Backup | All spaces and their three modules, format check before restore; space selection and validated data saved in a single canonical catalog | Old backups without a catalog restore into the active space; compatibility copies of the three old stores are kept |
| Closing | Waits for native writes; flushes the drawing autosave; confirmation for modified editors | A hardware failure before a write is committed cannot be guaranteed loss-free |

## Remaining before public distribution

1. Try real sync on two computers ([CLOUD.md](./CLOUD.md)).
2. Sign the app: this needs a Windows certificate and an Apple Developer account.
3. Try an automatic update end to end, from one signed version to the next.
4. Test the macOS installers on a real Mac, built with a licensed SDK.
5. Deploy the landing page from the `gather-landing` repository.
6. Sync files, with object storage rather than Postgres.
7. Finish the parity tracked in [PARITY_NON_AI.md](./PARITY_NON_AI.md), and translate starter template content.
8. Check the provenance of inherited code before distribution.

## Validation

Dated results are recorded in [VALIDATION.md](./VALIDATION.md).
