# PBSC Python Lab

A practice portal for Professor Porras's COP1000-21 Introduction to Programming class at Palm Beach State College.

- 57 topics and 114 original exercises, arranged in W3Schools' core Python, classes, and file-handling topic order.
- Plain-language explanations, small numbered steps, worked examples, expected output, hints, and common mistakes.
- Real Python in the browser using Pyodide and a Web Worker. Execution has a Stop button and 10-second time limit.
- Persistent class progress in D1, with an instructor dashboard, recent activity, submitted code review, and CSV export.

## Classroom use

The instructor opens the site with the ChatGPT account configured as INSTRUCTOR_EMAIL. Use the site's Share controls to invite students as viewers. The first deployment is owner-private until access is granted. Students sign in with ChatGPT, join with their name and the class code, and start practicing. The code is displayed on the instructor dashboard. Dashboard data refreshes every 15 seconds while open. The portal does not connect to Canvas or PBSC single sign-on.

## Development

Node.js 22.13 or later is required. Install from the pnpm lockfile and use the existing dev and build scripts. The application uses React, Vinext, Cloudflare Workers, D1, and Drizzle. Configure INSTRUCTOR_EMAIL and CLASS_JOIN_CODE through the hosting environment, never in source control. The DB binding is declared in .openai/hosting.json. Schema is in db/schema.ts; migrations in drizzle/ are applied by Sites when publishing.

The hosting platform supplies trusted authenticated-user headers. Outside Sites, provide a trusted authentication boundary before accepting these headers. Never expose a server that trusts arbitrary identity headers from clients.

## Curriculum and checks

Edit app/lib/curriculum.json to update lessons. All explanations and exercises are original. W3Schools reference links are provided for further reading; W3Schools is not affiliated with the portal. Advanced libraries, data science, and databases are outside the introductory path.

Exercise output and selected assertions are checked in the student's browser. These are formative practice results, not tamper-resistant exam grades. Instructors should review code to assess understanding. Completed exercises remain complete after later unsuccessful attempts.

The Program input field supplies one line per input() call. Files are temporary browser files, not files on a student's computer. PIP and virtual-environment lessons explain local terminal commands; they do not install packages in the portal. The initial Python download requires internet access to cdn.jsdelivr.net.

All 114 reference solutions were run against their expected output and Python assertions. TypeScript and production builds pass. Interactive browser layout and hosted sign-in should also be checked before classroom rollout.
