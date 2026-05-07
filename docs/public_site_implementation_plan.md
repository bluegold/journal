# Implementation Plan - Public Site with Astro & Basic Auth

Building a public-facing static site for the Journal app using Astro, deployed on Cloudflare Pages, with Basic Authentication and project-specific filtering.

## Objective
- Create a modern, high-quality static site using Astro and Tailwind CSS.
- Implement project-based navigation based on a configuration file.
- Secure the site with Basic Authentication via Cloudflare Pages Functions.
- Fetch content from the existing Journal API during the build process.

## Key Files & Context
- `public-site/`: Root for the Astro project.
- `public-site/src/config/projects.json`: Configuration for project tags and routes.
- `public-site/src/pages/`: Directory for page routes (including dynamic routes for projects).
- `public-site/functions/_middleware.ts`: Cloudflare Pages middleware for Basic Auth.
- `public-site/src/lib/api.ts`: Helper for Journal API interaction.
- `docs/api.md`: API reference for fetching entries.

## Proposed Strategy

### 1. Project Initialization & Configuration
- Re-initialize the `public-site` directory with a clean Astro structure.
- Create `src/config/projects.json` to define projects (slug, title, tags).
- Configure `astro.config.mjs` for Cloudflare Pages output (Static).
- Setup Tailwind CSS for styling.

### 2. Basic Authentication (Cloudflare Pages)
- Create `public-site/functions/_middleware.ts`.
- Implement Basic Auth logic using `JOURNAL_USER` and `JOURNAL_PASS` environment variables.

### 3. API Integration & Dynamic Routing
- Create a utility to fetch entries from the Journal API.
- Use `src/pages/[project].astro` to dynamically generate pages based on `projects.json`.
- Implement filtering logic using the tags defined in the config.

### 4. Design & Layout
- **Global Layout:** Dark/Light mode support (preferred sleek dark theme), typography-focused, minimal navigation.
- **Home Page (`/`):** List all projects from `projects.json` with a short description or latest entry.
- **Project Pages:** Dynamically generated listing pages for each project.
- **Entry Pages:** `/entries/[id].astro` to show individual entry details.

### 5. Deployment Readiness
- Ensure `package.json` has the correct build scripts for Cloudflare Pages.
- Document required environment variables: `JOURNAL_API_TOKEN`, `JOURNAL_API_URL`, `JOURNAL_USER`, `JOURNAL_PASS`.

## Implementation Steps

### Phase 1: Setup & Infrastructure
1. Clean up and scaffold `public-site/src`.
2. Configure `astro.config.mjs` and `tailwind.config.mjs`.
3. Create `public-site/functions/_middleware.ts` for Basic Auth.

### Phase 2: Data & Core Logic
1. Create `src/config/projects.json` with initial projects: `journal`, `ldf`, `zoffy-backend`.
2. Create `src/lib/api.ts` for fetching entries.
3. Implement dynamic routing in `src/pages/[project].astro` and `src/pages/entries/[id].astro`.

### Phase 3: Design & Polish
1. Implement the "cool" design with Tailwind CSS (sophisticated typography, subtle gradients, clean cards).
2. Refine the Markdown rendering for entry bodies.

## Verification & Testing
- **Local Testing:** Run `npm run dev` to verify layout and API fetching.
- **Build Verification:** Run `npm run build` to ensure static generation works correctly.
- **Middleware Check:** Verify `_middleware.ts` logic.
