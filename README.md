# ossiandackfors.com

Portfolio of Ossian Däckfors, gameplay programmer. Plain static HTML/CSS/JS with no build
step, no framework and no dependencies. Every file in this folder is exactly what gets served,
so it runs on GitHub Pages, Netlify, Cloudflare Pages, or any web server without changes.

## Layout

```
index.html                  Home: hero, projects, about, contact (#projects, #about, #contact)
time-to-breach/index.html   One folder per project, so URLs are /time-to-breach/ etc.
thrall/index.html           Projects are ordered newest first: Time to Breach, Thrall,
scapegoat/index.html        Scapegoat, Voxel Generator
voxel-generator/index.html
contacts/index.html         Redirects the old /contacts URL to /#contact
home/index.html             Redirects the old Google Sites /home URL to /
404.html                    Served by GitHub Pages for unknown URLs
_template/project.html      Starting point for a new project page
assets/css/site.css         All styles; design tokens at the top (:root)
assets/js/site.js           Mobile nav, table of contents, lightbox, code highlighting + copy, video
assets/img/<project>/       Images per project (og.jpg is the link-preview image)
assets/fonts/               Inter + JetBrains Mono (SIL Open Font License)
assets/Ossian_Dackfors_Resume.pdf   Built from resume/resume.html, see "Resume" below
resume/                     Resume source (resume.html) and the script that turns it into the PDF
tools/compress-image.ps1    Resize a screenshot and save it as a JPEG
tools/serve.mjs             Local preview server (Node, no packages)
CNAME                       Custom domain for GitHub Pages
.nojekyll                   Tells GitHub Pages to serve files as-is
```

All links are relative (`../assets/...`), so the site also works from a sub-path such as
`username.github.io/repo/`. The one exception is `404.html`, which uses root paths because it
can be served at any URL.

## Preview locally

From this folder:

```bash
node tools/serve.mjs
```

Then open http://localhost:8080. Any other static server works too (`npx serve .`,
`python -m http.server 8000`). Opening `index.html` straight from disk mostly works, but folder
links like `thrall/` only resolve through a server.

## Adding a project

1. Copy `_template/project.html` to `<slug>/index.html` and replace every `TODO`.
2. Put its images in `assets/img/<slug>/` (see "Images" below). Include `width` and `height` on
   every `<img>`, matching the file.
3. Add a card to the `#projects` grid in `index.html` (copy an existing `<article class="card">`,
   including its one-line `card__desc`), and renumber the cards if the order changes.
4. Update the previous/next links at the bottom of the neighbouring project pages.
5. The header and footer are copied into every page. If you change them, change them everywhere
   (search for `site-header` / `site-footer`).

Inside a project's `.prose`: `h2` is a numbered section in the table of contents, `h3` is a
subsection in the table of contents, and `h4` is a minor heading that stays out of it. Code goes in
`<figure class="code" data-lang="C++" data-name="...">` (`C++`, `C#` or `Python`) and must escape
`<`, `>` and `&`. Keep code lines under about 86 characters so they fit the code box without
scrolling. The template also shows the other building blocks: `ol.flow` (a row of steps),
`fig--pair` (two images side by side) and a looping video clip.

Every page ends with Results and What I'd Change. Keep claims to things the code actually does.

## Images

- Screenshots and art: JPEG, compressed with the included script (writes a `.jpg` next to the
  original; nothing to install):

  ```bash
  pwsh tools/compress-image.ps1 assets/img/thrall/new-shot.png -MaxWidth 1600
  ```

  Use `-MaxWidth 1600` for figures, `1200` for home-page cards and `1100` for a project's hero image.
- UI screenshots with small text (editor windows, Details panels): keep PNG.
- Link previews: each project has an `og.jpg` at 1.91:1, referenced by `og:image` in its `<head>`:

  ```bash
  pwsh tools/compress-image.ps1 shot.png -CropAspect 1.91 -MaxWidth 1200 -OutFile assets/img/<slug>/og.jpg
  ```

- Clips: a few seconds of the system working is worth more than any screenshot. Record with OBS,
  export MP4 (H.264, no audio, ideally under 5 MB), put it in `assets/video/<slug>/` and use the
  `<video autoplay muted loop playsinline>` figure from the template.

## Resume

`assets/Ossian_Dackfors_Resume.pdf` is generated. Edit `resume/resume.html` (plain HTML, one A4
page), then rebuild the PDF:

```bash
pwsh resume/build.ps1
```

The script prints the page with Microsoft Edge (or Chrome) in headless mode, so there's nothing to
install. Open the PDF afterwards and check that nothing spilled onto a second page.

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
