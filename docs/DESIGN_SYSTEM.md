# Design System

## 1. Direction

Codex 多开助手 should feel like a focused macOS utility for non-expert Codex users, not a marketing SaaS page.

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

### Current Product Direction

The MVP now follows a light macOS utility style inspired by QClaw's product rhythm, not its exact visuals:

- A translucent left sidebar anchors profile navigation and creation entry.
- The main workspace should stay focused on the selected profile after setup.
- Setup flows, environment checks, and auxiliary diagnostics should appear in modals instead of permanently occupying the dashboard.
- Summary cards may show high-level profile count, runtime count, and environment state.
- Dialogs should use soft white surfaces, 16-22px radius, subtle blur overlays, and compact controls.
- Primary actions use blue; success/warning/danger states remain semantic and restrained.
- Empty states should be compact and useful, never a marketing landing page.
- Global utility controls such as language, environment, refresh, and diagnostics belong in the top toolbar.
- For Chinese users, Simplified Chinese is the default UI language. English is available as a secondary global toggle.
- The public Chinese product name should communicate the core job directly. Prefer `Codex 多开助手` over technical names like `Codex Profile Manager` in user-facing surfaces.

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

The setup wizard should be opened on demand from "Create Profile" and shown as a modal.

The dashboard should not permanently show the wizard after a profile exists. Users can edit generated profiles from the selected profile detail panel.

Steps:

Steps:

1. Profile
2. Provider
3. Test
4. Launcher
5. Generate

Environment is a global modal, not a wizard step.

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

Current shell controls use 10px radius for compact toolbar and sidebar buttons, and 16px+ radius for larger panels/dialogs.

### Inputs

- Text input with label, description, validation message.
- Password input with reveal toggle.
- Select for provider type and model presets.
- File/path picker with reveal button.

### Toggles

- Use compact switch rows for boolean settings.
- The switch should be visually smaller than the label text.
- The label and description carry the meaning; the switch only shows state.
- Avoid oversized native checkboxes that compete with the setting text.

### Global Language Switch

- Place language switching in the fixed sidebar footer as a compact pill.
- Default to Simplified Chinese.
- Keep labels short: `中文` and `EN`.
- Do not place language switching inside profile setup; it is an app-level preference.

### App Icon

- Use a rounded macOS-style square.
- Communicate "multiple isolated Codex windows" through layered window panels.
- Use a small forward arrow or launch mark to imply opening a generated instance.
- Keep the icon legible at 16px by avoiding text and thin strokes.
- Use the product palette: blue primary, white surface, dark code accent, restrained green success accent.

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

Environment checks are diagnostics. They should be available from a toolbar status button and shown in a modal.

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
