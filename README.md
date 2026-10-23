# Python Practice — Professor Porras

A practice portal for Professor Porras's COP1000-21 Introduction to Programming class at Palm Beach State College.

- 57 topics and 114 original exercises, arranged in W3Schools' core Python, classes, and file-handling topic order.
- Plain-language explanations, small numbered steps, worked examples, expected output, hints, and common mistakes.
- Real Python in the browser using Pyodide and a Web Worker. Execution has a Stop button and 10-second time limit.
- Name-only joining and shared class progress on Cloudflare, with a private instructor dashboard and CSV export.

## Name-only classroom practice

The Cloudflare deployment now serves a shared classroom. Students enter **First Name** and **Last Name**, with no account, email, password, or class code. A random browser token keeps their practice session private. Returning with the same first and last name (case-insensitive) now resumes one student record across browsers and devices. On a student's next name-only sign-in, older duplicate records with the same normalized name are consolidated, preserving completed exercises and attempt history; existing browser tokens continue to work. **Important limitation:** name-only sign-in cannot prove identity. Two different students with identical names will share progress, and anyone who knows another student's full name could access that student's practice. For stronger privacy and identity protection, a private per-student PIN or class-issued code must be added.

Open **Instructor dashboard** (or append `?teacher=1`) and enter the private teacher access key. The teacher sees names, active students, current topics, completed exercises, attempt counts, the latest submitted code, and recent activity. It refreshes every 15 seconds and supports CSV export. Open a student to review code or remove an unwanted practice session. The private teacher key signs a one-time challenge in the browser and is never transmitted. A temporary session expires after eight hours; **Close teacher view** revokes it. Only the Ed25519 public verification key is committed.

Progress is stored in one Cloudflare Durable Object using its key-value API. There is no database service to create or SQL schema to manage. It retains each student's latest exercise progress and 30 recent code submissions, with a 500-session classroom limit.

## Build and deploy

Use Node.js 22.13 or newer, then `pnpm install --frozen-lockfile` and `pnpm build`.

- Cloudflare Workers Builds: build command `pnpm build`, deploy command `npx wrangler deploy`. The Worker name is `python-practice`; the root `wrangler.json` declares assets and the Durable Object. Existing commands using `dist/server/wrangler.json` are also supported after the build.
- This deployment does **not** use the old placeholder D1 binding. Durable Object storage is created by the first successful Worker deployment.
- On Cloudflare, runtime configuration automatically points to its own API.
- GitHub Pages: set `public/classroom-config.json` to `{"apiBase":"https://python-practice.hectorporras0916.workers.dev"}`, rebuild, and publish `docs/` to `gh-pages`. The API permits the exact GitHub origin in `STUDENT_ORIGIN`. An empty API base intentionally keeps the existing browser-local practice mode until the backend is deployed.
- `TEACHER_PUBLIC_KEY` in `wrangler.json` is the public Ed25519 verification key (32 bytes, base64). The separate private teacher access key is PKCS#8, base64, and must never be committed. To rotate access, generate a new pair and update only the public key in configuration. Anyone holding the private key can open the instructor dashboard.
- `pnpm dev:classroom` runs the Worker locally. `scripts/test-classroom.mjs` tests only a local classroom using a local `.env.teacher-access` file; do not point its synthetic fixtures at a real class.

The old Sites/Vinext implementation is available with `pnpm build:site`, but it is not used by the default Cloudflare deployment. Students need JavaScript and access to `cdn.jsdelivr.net` for Python.

## Curriculum and checks

Edit app/lib/curriculum.json to update lessons. All explanations and exercises are original. W3Schools reference links are provided for further reading; W3Schools is not affiliated with the portal. Advanced libraries, data science, and databases are outside the introductory path.

Exercise output and selected assertions are checked in the student's browser. These are formative practice results, not tamper-resistant exam grades. Instructors should review code to assess understanding. Completed exercises remain complete after later unsuccessful attempts.

The Program input field supplies one line per input() call. Files are temporary browser files, not files on a student's computer. PIP and virtual-environment lessons explain local terminal commands; they do not install packages in the portal. The initial Python download requires internet access to cdn.jsdelivr.net.

All 114 reference solutions were run against their expected output and Python assertions. TypeScript and production builds pass. Interactive browser layout and hosted sign-in should also be checked before classroom rollout.

## Browser-local fallback

An empty `apiBase` preserves the original GitHub Pages practice behavior: progress stays in the student's browser and can be downloaded as CSV. Shared class monitoring is enabled only after a real Cloudflare API URL is configured. Existing local practice data is preserved separately and is not silently assigned to a new classroom identity.

## Capstone Projects (Modules 1–6 practice)

Open **Capstone Projects** from the sidebar or the learning-path callout. Direct entry: `?view=capstones`; add `&project=cafe`, `&project=cinema`, or `&project=bookstore` to select an example.

Three original examples combine computational thinking, variables/input/expressions, strings, decisions, repetition, and functions: **Campus Café Checkout**, **Movie Ticket Kiosk**, and **Campus Bookstore Checkout**. This working alignment follows the saved course outline; the source outline predates the Fall 2026 section, so section-specific Canvas titles should be confirmed separately. Collections, classes, and file handling are not prerequisites.

Each example has a six-module walkthrough, pseudocode, a full editable Python program, guided constant/input controls, scenario input presets, a real Pyodide runner, Stop and timeout handling, a default-output comparison, previous-run comparison, and six challenges with explanations. All prices, rates, and business rules are explicitly classroom simulations. Programs calculate money in integer cents and round nonnegative percentage amounts half up.

Capstones are optional examples, separate from the existing 114 exercise grades and shared instructor progress. Draft code, input, and notes save under a student-specific key in the same browser. Students can download their current `.py` program and a Markdown practice report with predictions, code, inputs, output, and reflection. Reports identify stale output and include its original code/input snapshot when needed. No new backend records or classroom migrations are required.

- Content and reference code: `app/lib/capstones.json` and `public/capstones/*.py` (keep these in sync).
- Interface: `app/capstones.tsx` and `app/capstones.css`.
- Checks: `python3 scripts/test-capstones.py` covers 13 reference scenarios, independently specified invoice values, challenge variations, validation retries, zero orders, boundary conditions, and cent-rounding against Decimal.
- Validation for the initial release: 305 checks; TypeScript and production build; browser execution of all three references; parameter edits and saved drafts; desktop/mobile layout and light/dark theme review.

### Detailed capstone code guides

Each project’s Understand & predict section includes a part-by-part money() explanation, a default invoice calculation trace, a complete original-code line table, and a tax-change prediction with a revealed answer. The guide explains parameters, arguments, return values, validation, string methods, indentation, branches, loops, accumulators, percentage rounding, and project-specific charges. It refers to reference code rather than student edits.

Validation: 305 capstone checks, TypeScript, production build, and server rendering of every nonblank reference-code line across all three guides.
