# Public Site Layout

This document describes the current layout contract for `public-site`.
It is a working guide for the three page types that exist now:

- top page
- project page
- article page

Layout samples live under `/sample/...` and mirror the same structure for debugging and visual checks.

The layout is intentionally centralized and translucent. Background effects, spacing, and content blocks are separated so that moving a block between pages does not change its visual role.

## Shared Shell

All pages use the same outer shell:

- `site-shell`
  - full-page background and stacking context
- `site-matrix`
  - matrix rain background layer
- `site-header`
  - sticky top header
- `site-container`
  - centered content width
- `site-main`
  - page content area

### Visual rules

- Background stays dark.
- Matrix rain stays behind content.
- The content area is centered, not full bleed.
- The actual panel look lives in `site-pane`.
- `site-pane` is translucent, blurred, and rounded.
- `site-pane-inner` only provides internal padding when needed.

## Top Page

The top page is the entry point into the archive.

### Structure

- `site-top-hero`
  - a two-column hero block
- left side
  - `site-page-heading`
  - short explanatory copy
  - badge row aligned toward the bottom
- right side
  - translucent panel
  - summary image area
  - date / project index / short note
- `site-project-grid`
  - project tiles

### Project tile behavior

Each project tile is a translucent panel with:

- project title
- subtitle
- summary
- tags
- `Open project` action

Rules:

- the action is right-bottom aligned
- the tile has internal padding and a minimum height
- the tile should not look like a generic card; it should read as a project entry surface

## Project Page

The project page is the monthly archive view for one project.

### Structure

- `site-project-hero-shell`
  - outer translucent panel
- `site-project-hero-grid`
  - left intro column + right visual panel
- `site-project-hero-copy`
  - project title
  - subtitle
  - summary
  - tags
- `site-project-hero-panel`
  - hero image area
  - current month label
  - previous month / next month buttons
- `site-entry-list`
  - entry list

### Entry item behavior

Each entry item is a translucent panel with:

- date
- tags
- title
- summary
- `Open article` action

Rules:

- date is visually prominent
- the metadata row uses the full width of the card
- the content block is separate from metadata
- the action is fixed to the lower right
- the item has a minimum height so entries do not wobble by summary length

## Article Page

The article page is the reading view.

### Structure

- `site-article-head`
  - title block
  - date
  - tags
  - article navigation
- `site-article-body`
  - rendered Markdown

### Article header rules

- the header panel is slightly tighter vertically than the body panel
- `Back to project` stays on the left
- `Previous article` and `Next article` are aligned to the right
- the header title is smaller than the top page title

### Markdown body rules

The article body is where markdown styling matters most.

Supported block types:

- `h1`
- `h2`, `h3`, `h4`
- `p`
- `blockquote`
- `pre > code`
- `table`
- `ul`, `ol`
- `img`

Current styling rules:

- body `h1`
  - smaller than the page header title
  - no max-width restriction
  - uses a short accent line above it
  - no serif font; Japanese copy should read cleanly
- `h2` to `h4`
  - clear hierarchy
- `pre`
  - stronger background than body text
  - distinct border and shadow
- `table`
  - full-width table
  - visible border and header fill
  - readable cell padding
- body text
  - regular line spacing
  - no decorative treatment that competes with code or tables

## Class Responsibility Summary

### Layout and shell

- `site-shell`
- `site-header`
- `site-container`
- `site-main`
- `site-matrix`

### Panel and spacing

- `site-pane`
- `site-pane--strong`
- `site-pane-inner`
- `site-stack`

### Top page

- `site-top-hero`
- `site-top-hero-copy`
- `site-project-grid`
- `site-project-tile`
- `site-project-tile-image`
- `site-project-tile-title`
- `site-project-tile-summary`

### Project page

- `site-project-hero-shell`
- `site-project-hero-grid`
- `site-project-hero-copy`
- `site-project-hero-panel`
- `site-project-hero-image`
- `site-entry-list`
- `site-entry-item`
- `site-entry-content`
- `site-entry-title`
- `site-entry-summary`

### Article page

- `site-article-head`
- `site-article-meta`
- `site-article-nav`
- `site-article-body`

### Shared primitives

- `site-page-heading`
- `site-title`
- `site-eyebrow`
- `site-copy`
- `site-badge-row`
- `site-badge`
- `site-chip`
- `site-date`
- `site-tag-row`
- `site-tag`
- `site-action-row`
- `site-detail-button`

## Practical Constraints

- Do not let the header title styling leak into article body `h1`.
- Do not rely on `max-width` to control the main page headings.
- Do not put content blocks inside extra wrappers unless the wrapper has a clear layout role.
- Keep translucent panels and button-like primitives separate.
- Prefer layout classes over text-based styling assumptions.

## Current Intent

This site is a static archive with three page types. The layout should stay simple, centered, and readable. The main job of the layout is to provide:

- clear hierarchy
- consistent panel rhythm
- visible date emphasis
- readable markdown rendering
- easy navigation between top, project, and article pages
