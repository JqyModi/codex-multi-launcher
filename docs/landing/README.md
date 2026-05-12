# Landing Page

This folder contains a static GitHub Pages-ready landing page for Codex 多开助手.

## Local Preview

From `CodexProfileManager`:

```bash
python3 -m http.server 4174 --directory docs
```

Then open `http://127.0.0.1:4174/landing/`. You can also open `docs/landing/index.html` directly in a browser.

## Before Publishing

Replace placeholder links in `index.html`:

- `https://github.com/your-org/codex-multi-launcher/releases/latest`
- `https://github.com/your-org/codex-multi-launcher/issues`

If GitHub Pages is configured to serve from `/docs`, keep the current relative image paths.
