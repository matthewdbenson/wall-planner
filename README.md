# Wall Planner

Personal/family wall planner — single-page web app.

## Stack

- Vanilla HTML/CSS/JS, no build step
- Anthropic API (Claude) for AI planning advisor
- Nager.Date API for public holidays
- Currently: localStorage for all data persistence

## Roadmap

- [x] Phase 1 — Vercel deployment (static HTML)
- [ ] Phase 2 — Supabase auth + database (cross-device sync)
- [ ] Phase 3 — View-only sharing + family shared entries

## Local development

Just open `index.html` in a browser. No server needed.

## Deployment

Hosted on Vercel. Push to `main` to deploy.

```
git push origin main
```

## Environment

The Anthropic API key is embedded in the HTML for now (personal use only).
Move to a server-side proxy in Phase 2 when auth is added.

## Data model (current — localStorage)

| Key | Contents |
|-----|----------|
| `wall-planner-v4` | Day entries (colour, note, important flag) |
| `wall-planner-recur-v1` | Annual recurring entries |
| `wall-planner-icons-v1` | Icon assignments per day |
| `wall-planner-hol-v1` | Holiday settings (enabled, countries) |
| `wall-planner-hol-cache-v1` | Cached holiday data from Nager.Date |
| `wall-planner-about-v1` | "About me" text for AI context |
| `wall-planner-legend` | Legend label names |
| `wall-planner-projects-v1` | Projects list |
