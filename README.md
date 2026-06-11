# Connexus IOT — Website

Marketing website for **Connexus IOT**, served via GitHub Pages on the custom domain
**[www.connexusiot.com](https://www.connexusiot.com)**.

## How it works
- `index.html` — the entire single-page site (HTML + embedded CSS). Edit this to update content.
- `CNAME` — tells GitHub Pages to serve the site on `www.connexusiot.com`. **Do not delete.**
- `.nojekyll` — disables Jekyll processing so all files are served as-is.

## Updating the site
1. Edit `index.html`.
2. Commit and push to the `main` branch.
3. GitHub Pages rebuilds automatically within ~1 minute.

## DNS (configured at GoDaddy)
- `CNAME` record: `www` → `tushar-github-tech.github.io`
- `A` records: `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
