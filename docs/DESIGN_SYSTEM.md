# Design System

## 1. Direction

Codex Profile Manager should feel like a focused macOS developer utility, not a marketing SaaS page.

The interface should prioritize:

- Clear setup guidance for first-time users.
- Dense but readable profile management after setup.
- Explicit paths, status, and diagnostics.
- Calm visual hierarchy that makes configuration risks obvious.

Qclaw is a useful reference for product structure: setup wizard, environment check, dashboard, backup, and diagnostics. It should not be copied visually.

## 2. Visual Principles

- Prefer native-feeling macOS panels, sidebars, tables, and segmented controls.
- Use cards only for repeated profile rows, summary panels, and dialogs.
- Avoid oversized hero sections, decorative gradients, and marketing-style layouts.
- Keep spacing tight enough for a utility app.
- Make destructive or risky states visually distinct.
- Show technical paths in monospace text with copy/reveal actions.

## 3. Layout

### App Shell

- Left sidebar: profiles, setup entry, diagnostics, settings.
- Main panel: selected profile details or setup wizard.
- Top toolbar: app title, global status, primary action.

Suggested desktop size:

```text
Minimum: 1040 x 680
Comfortable: 1180 x 760
```

### Setup Wizard

Use a two-column layout:

- Left: step list and current progress.
- Right: form, validation, and preview.

Steps:

1. Environment
2. Profile
3. Provider
4. Test
5. Launcher
6. Finish

### Dashboard

Use a profile list with compact rows:

- Profile name.
- Provider and model.
- Running status.
- Last launched.
- Launcher path.
- Actions.

Selecting a row opens a detail panel with paths, generated config preview, backup history, and diagnostics.

## 4. Color Palette

Primary light theme:

```text
App Background: #F6F7F9
Surface:        #FFFFFF
Surface Alt:    #F1F4F8
Border:         #D8DEE8
Text:           #172033
Muted Text:     #667085
Primary:        #2563EB
Primary Hover:  #1D4ED8
Success:        #16A34A
Warning:        #D97706
Danger:         #DC2626
Code Dark:      #111827
Code Text:      #E5E7EB
Focus Ring:     #93C5FD
```

Dark mode can be added later. MVP should first make the light theme polished.

## 5. Typography

Use system fonts for native feel:

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
```

Use monospace for paths, env vars, config snippets:

```css
font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
```

Type scale:

```text
Page title: 22px / 28px / 650
Section title: 15px / 22px / 650
Body: 13px / 20px / 400
Small: 12px / 16px / 400
Code: 12px / 18px / 400
```

Do not scale font size with viewport width.

## 6. Components

### Buttons

- Primary: main forward action.
- Secondary: neutral actions.
- Ghost icon button: reveal, copy, edit, refresh.
- Danger: delete or destructive reset.

Buttons should have 6px radius and stable height.

### Inputs

- Text input with label, description, validation message.
- Password input with reveal toggle.
- Select for provider type and model presets.
- File/path picker with reveal button.

### Status Badges

Allowed states:

- Running: green.
- Not running: neutral.
- Unknown: amber.
- Error: red.

### Code Preview

Generated `config.toml` preview should use a dark code block with copy action.

### Diagnostics

Diagnostics should use grouped rows:

- Check name.
- Result.
- Explanation.
- Suggested action.

## 7. Interaction Rules

- Every destructive action requires confirmation.
- Every generated file path should have "Reveal in Finder".
- Every config write should show what will be changed before generation.
- API keys should be redacted after entry.
- Background-launched instances must remain visible in dashboard status.
- Errors should show a short human explanation first and raw details behind disclosure.

## 8. Empty States

First launch:

- Show setup entry immediately.
- Do not show a marketing landing page.

No profiles:

- Show a compact empty state with one primary button: "Create Profile".

No backups:

- Show "No snapshots yet. A snapshot is created before every config change."

## 9. Anti-Patterns

- Do not use gradients as primary structure.
- Do not create nested cards inside cards.
- Do not hide filesystem paths when they are relevant to user trust.
- Do not use vague provider status such as "looks good" without technical detail.
- Do not claim compatibility with Chat Completions-only providers in MVP.
