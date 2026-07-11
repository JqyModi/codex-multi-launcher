# Announcements

The app can show a lightweight remote banner on the Profile page.

## Local verification

Start the sample announcement server:

```sh
npm run serve:announcements
```

In another terminal, run the app with the local config URL:

```sh
CODEX_PROFILE_MANAGER_ANNOUNCEMENTS_URL=http://127.0.0.1:7421/announcements.sample.json npm run dev
```

Expected result:

- a promo banner appears above the dashboard status cards
- `查看` opens the configured URL
- the close button hides the banner
- after closing, the same `id` stays hidden because it is stored in app user data

To show it again, change the `id` in `docs/announcements.sample.json`, or delete the announcement state file under the app user data directory.

## Remote production config

By default the app reads:

```text
https://jqymodi.github.io/codex-multi-launcher/announcements.json
```

The file should use the same format as `docs/announcements.sample.json`.

If the remote request fails, the app uses the last cached config. If there is no cache, it shows nothing.
