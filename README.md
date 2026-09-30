# ossiandackfors.com

Portfolio of Ossian Däckfors, gameplay programmer. Plain static HTML/CSS/JS with no build
step, no framework and no dependencies. Every file in this folder is exactly what gets served,
so it runs on GitHub Pages, Netlify, Cloudflare Pages, or any web server without changes.

## Layout

```
index.html                  Home: hero, projects, about, contact (#projects, #about, #contact)
time-to-breach/index.html   One folder per project, so URLs are /time-to-breach/ etc.
thrall/index.html
scapegoat/index.html
voxel-generator/index.html
contacts/index.html         Redirects the old /contacts URL to /#contact
home/index.html             Redirects the old Google Sites /home URL to /
404.html                    Served by GitHub Pages for unknown URLs
_template/project.html      Starting point for a new project page
assets/css/site.css         All styles; design tokens at the top (:root)
assets/js/site.js           Mobile nav, table of contents, lightbox, code highlighting + copy, video
assets/img/<project>/       Images per project
assets/fonts/               Inter + JetBrains Mono (SIL Open Font License)
assets/Ossian_Dackfors_Resume.pdf
CNAME                       Custom domain for GitHub Pages
.nojekyll                   Tells GitHub Pages to serve files as-is
```

All links are relative (`../assets/...`), so the site also works from a sub-path such as
`username.github.io/repo/`. The one exception is `404.html`, which uses root paths because it
can be served at any URL.

## Preview locally

Any static server works. From this folder, either of these:

```bash
npx serve .
```

```bash
python -m http.server 8000
```

Open the address it prints. Opening `index.html` straight from disk mostly works, but folder
links like `thrall/` only resolve through a server.

## Adding a project

1. Copy `_template/project.html` to `<slug>/index.html` and replace every `TODO`.
2. Put its images in `assets/img/<slug>/`. Include `width` and `height` on every `<img>`.
3. Add a card to the `#projects` grid in `index.html` (copy an existing `<article class="card">`).
4. Update the previous/next links at the bottom of the neighbouring project pages.
5. The header and footer are copied into every page. If you change them, change them everywhere
   (search for `site-header` / `site-footer`).

Inside a project's `.prose`: `h2` is a numbered section in the table of contents, `h3` is a
subsection in the table of contents, and `h4` is a minor heading that stays out of it. Code goes in
`<figure class="code" data-lang="C++" data-name="...">` and must escape `<`, `>` and `&`.

## Publishing

The repo is `Ossdac/ossian.games`, published with GitHub Pages from `main` / `(root)`
(**Settings → Pages**). Commit and push, and the site updates about a minute later.

## Domains

- **ossiandackfors.com** is the real address. The `CNAME` file holds it, and it must match
  **Custom domain** under Settings → Pages.
- **ossian.games** only redirects here. A second two-file repo does the redirect
  (`Ossdac/ossian.games-redirect`, local folder `Documents\ossian.games-redirect`). It forwards
  every path, so old links like `ossian.games/thrall` still land on the right page. If
  ossian.games is ever allowed to expire, delete that repo; nothing in this one changes.

DNS at Hover is the same for both domains (the MX record for Hover email is left alone):

- `A` `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- `AAAA` `@` → `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
- `CNAME` `www` → `ossdac.github.io`

After a DNS change, tick **Enforce HTTPS** under Settings → Pages once GitHub has issued the
certificate. The old Google Sites paths (`/time-to-breach`, `/thrall`, `/scapegoat`,
`/voxel-generator`, `/contacts`, `/home`) all keep working.

## Moving to another host later

Upload the folder as-is. For Netlify or Cloudflare Pages, point them at the repo with no build
command and `/` as the output directory. The `CNAME` and `.nojekyll` files are only used by
GitHub and are harmless elsewhere.
