# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-page static website for Coorg Investments — a boutique real estate firm selling coffee estates, villas, and land in Coorg, Karnataka, India. The entire site lives in one file: [index.html](index.html).

No build tools, no package manager, no framework. Open `index.html` directly in a browser to preview changes.

## Architecture

Everything is self-contained in `index.html`:
- **CSS** — all styles in a `<style>` block in `<head>`, using CSS custom properties (`--forest`, `--gold`, `--ivory`, etc.) for the color palette
- **HTML** — sections: nav, mobile-menu, hero, why-coorg, listings, about, contact, footer, floating-wa, video-modal
- **JS** — inline `<script>` at bottom; handles hamburger menu, scroll fade-in (`IntersectionObserver`), property filter tabs, and YouTube video modal

## Key Patterns

**Property cards** — each `.property-card` has a `data-type` attribute (`estate`, `villa`, or `land`) used by `filterProps()` for client-side filtering. No data fetch; listings are hardcoded HTML.

**WhatsApp links** — all CTA buttons use `https://wa.me/919632288853` with URL-encoded `text=` params pre-filled per property. The phone number `+91 96322 88853` appears throughout.

**Video modal** — cards reference `YOUTUBE_ID_1`, `YOUTUBE_ID_2` etc. as placeholders. Replace these string values with real YouTube video IDs to enable the modal; the `openVideo()` function checks for the `YOUTUBE_ID_` prefix and shows an alert instead if placeholder.

**Scroll animations** — elements with `.fade-up` class are observed and get `.visible` added when they enter the viewport. Respects `prefers-reduced-motion`.

**Responsive breakpoints** — 900px (mobile nav, single-column layouts) and 600px (single-column cards, hide hero stats).
