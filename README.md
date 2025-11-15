This is my React + TypeScript web application, powered by Vite for fast builds and dev previews, styled with Tailwind CSS and shadcn-ui. You can develop locally in your preferred IDE, work directly on GitHub, spin up a cloud dev environment with Codespaces, or use your chosen platform’s hosted editor. Below is a practical guide for setup, development, deployment, and custom domains.

✨ Key Features
Modern stack: Vite + React + TypeScript for speed and type safety
Tailwind CSS utilities and shadcn-ui components for consistent, accessible UI
Hot-reload local development with instant feedback
Production build optimized for performance
🛠 How to Edit and Develop
Option A — Local Development (Recommended for most work)
Run and iterate locally with full tooling support, testing, and version control.

Prerequisites
Node.js (LTS recommended). If you use nvm:
nvm install --lts
nvm use --lts
Git installed
Clone and install
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
Start the dev server
npm run dev
Open the printed URL (typically http://localhost:5173). Changes in src/ hot-reload automatically.
Commit and push
git add -A
git commit -m "feat: describe your change"
git push
Tips

If port 5173 is busy: npm run dev -- --port 5174
Keep Node up to date via nvm to avoid build inconsistencies
Option B — Edit Directly on GitHub
Great for quick copy edits, minor fixes, or config tweaks.

Open the repository on GitHub
Navigate to the file you want to change
Click the pencil icon, make edits, and commit
Use branches + pull requests for review flows
Option C — GitHub Codespaces (Cloud Dev)
A full-featured, browser-based dev environment with Node preinstalled.

On your repo: Code → Codespaces → New codespace
In the terminal: npm i then npm run dev
Develop, preview, commit, and push directly from the cloud
📂 Project Structure
A quick mental map of where things live.

index.html — Vite HTML template and mount point
src/main.tsx — App bootstrap (React root, providers)
src/App.tsx — Root component for routing or layout shell
src/components/ — Reusable UI components
src/pages/ — Page-level components (if using a pages pattern)
src/lib/ — Utilities, API clients, helpers
public/ — Static assets copied as-is
tailwind.config.js — Tailwind theme and paths
postcss.config.js — Tailwind/PostCSS pipeline
tsconfig.json — TypeScript configuration
vite.config.ts — Vite build and dev server settings
🎨 UI and Styling Conventions
Tailwind CSS for utilities and rapid iteration
shadcn-ui components for accessible, themeable building blocks
Keep design tokens and color choices centralized in tailwind.config.js
Prefer composition: wrap shadcn primitives to match your app’s patterns
Component Tips

Create a src/components/ui/ folder for shadcn-derived components
Favor props-driven components with clear typing
Co-locate small styles with components; extract shared patterns into utilities
🔧 Scripts and Common Tasks
npm run dev — Start the Vite dev server with hot reload
npm run build — Production build (outputs to dist/)
npm run preview — Serve the production build locally
npm run typecheck — TypeScript type validation (if configured)
npm run lint / npm run format — Linting and formatting (if configured)
Add a dependency

npm i <package-name> Add a dev dependency
npm i -D <package-name>
🌐 Environment Variables
Vite exposes only variables prefixed with VITE_ at build time.

Create a .env file for local use (do not commit secrets)
Example:
VITE_API_URL=https://api.example.com
VITE_FEATURE_X=true
Use in code
const apiUrl = import.meta.env.VITE_API_URL
Production/hosted environments
Set the same variables in your hosting provider’s environment settings
Security note

Never commit .env with secrets
Use separate env files per environment (.env.local, .env.staging, etc.)
🚀 Building and Deploying
Local Production Test
npm run build
npm run preview This simulates production and helps catch issues like missing env vars or path problems.
Deployment Options
Use whichever hosting suits your workflow:

Static hosting (Netlify, Vercel, Cloudflare Pages): Connect your repo; set build command npm run build and output directory dist
Containerized hosting (Render, Fly, AWS, GCP, Azure): Serve dist/ with a static server or use an edge/static platform
Typical Netlify/Vercel config

Build command: npm run build
Output directory: dist
Environment variables: add VITE_* keys
Production branch: main (or your chosen default)
🔒 Custom Domains
Point your domain to your hosting provider:

Add the domain in your host’s dashboard
Follow DNS instructions (usually a CNAME for subdomains or A/AAAA for root)
Allow time for DNS propagation (often minutes, sometimes up to 24–48 hours)
Add redirects/rewrites if you use client-side routing (e.g., SPA fallback to /index.html)
Example SPA rewrite rules

Netlify: redirect /* /index.html 200
Vercel: use vercel.json with a fallback to index.html or framework preset
✅ Quality Checks Before You Ship
Type safety: run type checks and fix any errors
Lint and format: enforce a consistent code style
Accessibility: verify color contrast and keyboard navigation
Performance: check Lighthouse (largest contentful paint, bundle size)
SEO basics: title, meta description, social share images
Error boundaries: add error boundaries for critical routes
🧪 Testing (Optional but Recommended)
If you add testing, a common setup:

Unit tests: Vitest + React Testing Library
E2E tests: Playwright or Cypress
Scripts: npm run test / npm run test:watch
Folder patterns

src/tests/ for unit tests
e2e/ for end-to-end specs
🤝 Collaboration Workflow
Create feature branches from main
Open pull requests early for visibility
Use conventional commits (feat, fix, chore) for readable history
Enable required checks (CI, lint, tests) before merge
🧰 Troubleshooting
Dev server doesn’t start

Ensure Node LTS is active (nvm use --lts)
Delete node_modules and package-lock.json, then npm i
Try a different port: npm run dev -- --port 5174
Tailwind classes not applying

Verify content paths in tailwind.config.js include your src/**/*.{ts,tsx} files
Confirm index.css imports Tailwind base, components, utilities
TypeScript errors after upgrades

Align TS version with @types packages
Re-run npm i after changing TS-related config
404s on refresh in production

Add SPA rewrites so all routes serve index.html
