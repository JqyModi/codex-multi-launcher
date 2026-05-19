# Reddit English Launch Draft

## Goal

Validate whether English-speaking Codex Desktop users also feel the pain of switching between multiple API keys, Base URLs, and Responses-compatible providers.

## Posting Notes

- Read subreddit rules before posting.
- Use a text post, not a pure link drop.
- Do not cross-post to many communities on the same day.
- Stop before final publish and ask for user confirmation.

## Candidate Communities

- `r/OpenAI`
- `r/ChatGPTCoding`
- `r/macapps`
- `r/LocalLLaMA`

Pick only one or two that allow project feedback or open-source tool posts.

## Title Options

```text
I built a small macOS utility for isolated Codex Desktop profiles
```

```text
Early MVP: separate API keys, Base URLs, and launchers for Codex Desktop profiles
```

## Body

```markdown
I kept running into a small but annoying Codex Desktop workflow problem:

- one project uses my default OpenAI setup
- another project needs a different API key
- provider testing needs a custom Base URL
- I want separate Codex windows without manually editing config files every time

So I built an early macOS MVP for isolated Codex profiles.

What it does today:

- creates separate Codex profile folders
- stores a per-profile API key locally
- writes per-profile Base URL / model config
- generates a double-clickable launcher app for each profile
- can test basic Responses-compatible third-party providers

It is not a polished commercial app yet. The current build is mainly for macOS, unsigned, and focused on validating whether this workflow is useful to other Codex users.

GitHub:
https://github.com/JqyModi/codex-multi-launcher

Latest release:
https://github.com/JqyModi/codex-multi-launcher/releases/latest

I am especially looking for feedback on:

1. whether the profile isolation matches your workflow
2. which third-party Responses-compatible providers work or fail
3. whether Windows support is important
4. whether multi-account login isolation matters more than API key isolation
5. any confusing step in setup

If this is useful, please open an issue with your environment and provider details:
https://github.com/JqyModi/codex-multi-launcher/issues
```

## Optional First Comment

```text
For clarity: this does not modify the original Codex app. It creates separate profile folders and launcher apps so each workspace can carry its own config.
```

