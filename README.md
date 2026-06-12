# Connexus IOT — Website

Sci-fi animated marketing website for **Connexus IOT**, served via GitHub Pages on the
custom domain **[www.connexusiot.com](https://www.connexusiot.com)**.

## File structure

| File | What it is |
|------|------------|
| `index.html` | Page structure (nav, hero, control deck, features, security, contact) |
| `css/style.css` | All styling + animations |
| `js/config.js` | **⭐ Brand config — edit THIS to change logo / name / colors / email** |
| `js/main.js` | Animations engine + interactive device demo logic |
| `assets/logo.svg` | The logo image (replace with your own) |
| `CNAME` | Binds GitHub Pages to `www.connexusiot.com`. **Do not delete.** |
| `.nojekyll` | Disables Jekyll processing so all files serve as-is |

## 🎨 How to change the LOGO (2 ways)

**Way 1 (easiest):** Replace `assets/logo.svg` with your own logo file (keep the same
filename). SVG or square PNG works best. Done.

**Way 2:** Put your logo anywhere (e.g. `assets/mylogo.png`) and open `js/config.js`,
change:

```js
logoUrl: "assets/mylogo.png",
```

## ✏️ How to change name / taglines / colors / contact

Open `js/config.js` — everything is labelled:

```js
brandName:   "Connexus",     // first part of the name
brandSuffix: "IOT",          // colored second part
taglines:    [ ... ],        // hero typing lines
colors:      { accent: "#00e5ff", ... },
contactEmail: "hello@connexusiot.com",
```

Save → refresh. No build step needed.

## Updating the live site

1. Edit files locally.
2. `git add -A && git commit -m "update" && git push`
3. GitHub Pages rebuilds automatically within ~1 minute.

## DNS (configured at GoDaddy)

- `CNAME` record: `www` → `tushar-github-tech.github.io`
- `A` records: `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
