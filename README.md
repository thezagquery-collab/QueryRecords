# QueryRecords

QueryRecords — music catalog site for Zag Query artists (albums, EPs, singles by artist). GitHub Pages.

## Overview

A dependency-free static site: plain HTML, CSS and vanilla JavaScript, deployable directly to GitHub Pages (no build step). The catalog data lives in [`assets/js/catalog.js`](assets/js/catalog.js).

- `index.html` — homepage listing all Zag Query artists.
- `artist.html?id=<artist-id>` — an artist's discography, grouped into Albums, EPs and Singles.

## Local development

Requires Node.js (a static file server is used for local preview only — the site itself has no build step).

```bash
npm install   # installs the http-server dev dependency
npm run dev   # serves the site at http://localhost:8000
```

Then open http://localhost:8000.

## Adding artists / releases

Edit [`assets/js/catalog.js`](assets/js/catalog.js). Each artist has an `id`, `name`, `tagline`, a `gradient` (used for cover art), and a list of `releases`. Each release has a `title`, `type` (`Album` / `EP` / `Single`), `year`, `gradient` and `tracks`.

## Deployment

The repository is served directly by GitHub Pages. A `.nojekyll` file disables Jekyll processing so files under `assets/` are served as-is.
