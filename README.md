# ghris — Roblox UI artist

Portfolio: **https://ghrisdev.github.io/**

Seven UI collections, swipeable project galleries, material/theme filters, and thirteen motion previews.

- Discord: **ghrisdev**
- Portfolio server: https://discord.gg/8PHRu4UEJz
- Email: **ghris1107@gmail.com**

## Run locally

```sh
python3 -m http.server 8780
```

No installation or build step is required.

## Deploy

GitHub Pages publishes the `main` branch from `/ (root)`. The `.nojekyll` file serves the static site directly. Updates committed to `main` deploy automatically.

## Edit

- `content.json`: projects, gallery slides, tags, and motion previews.
- `index.html`: page copy and contact details.
- `styles.css`: styling and responsive layout.
- `app.js`: gallery navigation, filters, motion panels, and email drafts.
- `assets/`: still artwork and animated WebP previews.
- `vendor/`: Motion 14.6.0 and its MIT license.

OS reduced-motion preferences are respected. The email form opens a draft in the visitor’s email app; it does not send email from a server.

Portfolio artwork is reserved to its respective owner. Preview credits and save/drag deterrents do not prevent screenshots or browser asset retrieval.
