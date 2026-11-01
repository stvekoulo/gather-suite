# Non-AI parity tracking

Target confirmed by Steven KOULO: reproduce all the requested features of the reference products, except AI. This target is not fully reached yet. "Partial" entries must not become sales promises.

## Workspaces

Local isolation done: calendar, documents and files, invoices, notes and their resources, presentations, whiteboard, libraries, tasks, spreadsheets and snippets. The selected catalog and the three modules are saved in a single canonical state. The old stores remain as compatibility copies.

Migration keeps historical data in the previously active space. Old extra labels become empty spaces, because the data had no reliable historical assignment. No old store is deleted. Undo, open components and autosaves are reset on switching. Running imports or conversions and the timer block a switch.

A backup includes all spaces, and an old backup without a catalog can still be imported into the active space. This local mechanism does not replace server-side authorization between SaaS accounts.

## Notes, Blinko reference

| Area | Gather status |
| --- | --- |
| Memos, long notes, Markdown/GFM tasks | Present |
| Hierarchical tags, parents and sub-tags, rename/delete | Present |
| Pinning, archives, trash/restore, search and filters | Present |
| References, backlinks, journal, review | Present |
| Version history and restore | Present; history kept when importing our own exports |
| Attachments, ordering, audio/video download | Present |
| Resource manager | Present: search, rename, download, remove from note |
| Bulk actions | Present: archive, tags, trash/restore, ZIP export |
| Reminders | Local: while Gather and the space are open, catching up on return; no server scheduling |
| Comments | Simple and local; nested replies and collaboration still to complete |
| JSON, Markdown, ZIP and `.bko` | Present; no full migration of Memos SQLite and server accounts |
| Protected public sharing, between accounts, federation/following | To build with the backend and its access controls |
| Server RSS, plugins, server jobs/scheduled backups | To build |
| RAG, embeddings, AI chat, generation and AI tasks | Out of scope |

References analyzed in `.reference/blinko/server/routerTrpc/`: `note`, `tag`, `attachment`, `comment`, `public`, `follows`, `task`, `plugin`, `notification`, `user`.

## Office

| Area | Gather status |
| --- | --- |
| Text editing, styles, lists, tables, images and links | Present |
| Sizes/colors and alignment | Present in the editor and exports |
| Find/replace, undo, manual page breaks | Present; search limited to one text node at a time |
| A4/Letter, portrait/landscape, margins | Present and saved |
| Headers, footers, page numbers, table of contents | Present in DOCX/PDF; DOCX fields must be refreshed by the Office reader |
| Rich PDF with automatic pagination | Present; text, styles, tables, images and links |
| Live visual pagination in the editor | To build: the editor still shows a continuous flow |
| DOCX import | Partial: sections, styles, objects and complex layouts are not fully faithful |
| Complex merged tables and advanced typography | To deepen |
| Creating/editing presentations, objects, notes, themes | Present |
| PPTX import/export | Real export; partial import, complex objects and masters not fully kept |
| Animations, transitions, charts, multi-window presenter view | To build |

## PDF, Stirling-PDF reference

The Stirling engine is not embedded. Gather's PDF tools are local implementations; their number does not mean parity with all of the reference's tools.

| Reference tools or families | Gather status |
| --- | --- |
| `merge`, `extractPages`, `reorganizePages`, `removePages` | Basic operations present; reordering and duplicating through typed ranges |
| `split` | Each page in a ZIP file, or a range selection; advanced splitting to complete |
| `rotate` | Rotates all pages by 90°; page selection and other angles to complete |
| `addPageNumbers`, `addWatermark` | Present, with more limited placement and style options |
| `adjustPageScale`, `crop` | Resize with fit, uniform crop; advanced options to complete |
| `changeMetadata` | Title/author; advanced metadata to complete |
| `flatten` | Flattens form fields; no full handling of annotations |
| `ocr` | French/English embedded, offline, text and searchable PDF; other languages and advanced modes to complete |
| `compress` | Rewrite and JPEG rasterization; no full optimization of objects/vectors, no target size |
| `convert` | PNG/JPEG images to PDF and PDF to PNG/ZIP; Office, HTML and advanced formats to build |
| `redact` | Rasterized rectangle, output without the old text layer; graphical selection and advanced rules to complete |
| Text/highlight | Flattened additions; no full interactive annotation editor |
| `addPassword`, `removePassword`, `changePermissions` | To build |
| `certSign`, `validateSignature` | RSA PKCS#12/CMS signature and integrity check implemented, unit tests pass; trust, revocation, EC keys, successive signatures and full interface validation still to complete |
| `sign`, `timestampPdf`, `removeCertificateSign` | Drawn signature, certified timestamp and certificate removal to build; the CMS signature is implemented separately |
| `addAttachments`, `addStamp`, `overlayPdfs`, `extractImages`, `createPortfolio` | To build |
| `editTableOfContents`, `pageLayout`, `bookletImposition`, `singleLargePage` | To build |
| `compare`, `repair`, `sanitize`, `showJS`, `removeAnnotations` | To build |
| `adjustContrast`, `replaceColor`, `removeBlanks`, `scannerImageSplit`, `autoRotate` | To build |
| `autoFormDetection`, `unlockPdfForms`, form editing | To build |
| `automate` and pipelines | To build |

Catalog inspected: `.reference/Stirling-PDF/frontend/src/editor/core/components/tools/`. Automatic features must be reviewed one by one to separate classic algorithms from the AI features that are excluded.

## Checks

See [VALIDATION.md](./VALIDATION.md). Compiling and passing tests do not validate the features marked "to build" in this document.
