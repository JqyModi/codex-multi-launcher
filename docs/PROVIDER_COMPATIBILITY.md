# Provider Compatibility Guide

This guide explains how to judge whether a third-party API provider can work with Codex Multi Launcher. It is written for user support, public feedback, and future compatibility tracking.

## Compatibility Rule

Codex Multi Launcher does not adapt every provider's native API format. The current MVP writes Codex provider configuration and launches Codex with an API key, Base URL, model, and `wire_api = "responses"`.

A provider is expected to work when it offers:

- an OpenAI-compatible Base URL, usually ending with `/v1`;
- an API key accepted through `Authorization: Bearer <key>`;
- a model ID that Codex can request;
- a Responses-compatible endpoint for Codex requests.

If a provider only supports Chat Completions, or only exposes its own native SDK/API shape, it may fail even if the API key itself is valid.

## What Users Need To Fill In

| Field | Meaning | Example |
| --- | --- | --- |
| Provider name | A local display name | `Su8`, `Zhipu Proxy`, `Company Gateway` |
| Base URL | Provider's OpenAI-compatible endpoint | `https://example.com/v1` |
| Model | Exact model ID accepted by the provider | `gpt-5.2`, `glm-4.6` |
| API Key | Provider key | `sk-...` |

The app stores API keys in a local encrypted file. API keys are not written to `config.toml`, launcher scripts, or diagnostics reports.

## Model List Detection

Many compatible providers expose a `/models` endpoint. Codex Multi Launcher tries to load models from:

```text
<Base URL>/models
```

The parser accepts common response containers such as `data`, `list`, `results`, or a plain array. An item is treated as a model when it has a string `id`.

Common compatible shape:

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-5.2",
      "object": "model"
    }
  ]
}
```

If model loading fails, users can still type the model ID manually. A failed `/models` request does not always mean the provider is unusable.

## Known Provider Status

| Provider | Status | Notes |
| --- | --- | --- |
| OpenAI official API | Expected | Uses official OpenAI API key and model IDs. |
| Su8 | Tested by author | Works with Responses-compatible configuration in local testing. |
| Zhipu / GLM | Unverified | Should be tested through an OpenAI/Responses-compatible gateway. Native Zhipu-only API format is not guaranteed. |
| DeepSeek | Unverified | OpenAI-compatible Chat Completions is common; Responses compatibility still needs user testing. |
| Moonshot / Kimi | Unverified | Needs an OpenAI/Responses-compatible endpoint and model ID. |
| Qwen / Tongyi | Unverified | Needs an OpenAI/Responses-compatible endpoint and model ID. |
| OpenRouter | Unverified | Likely depends on whether Codex requests are accepted through the configured Responses-compatible route. |
| Self-hosted relay | Unverified | Usually the best candidate if it explicitly supports Responses-compatible requests. |

## Troubleshooting

### Can it connect to Zhipu?

Maybe, but only when the endpoint behaves like an OpenAI/Responses-compatible provider.

If the user only has Zhipu's native API endpoint, it may not work. Ask the user for:

- Base URL, with the key redacted;
- model ID;
- whether the provider says it supports OpenAI-compatible or Responses-compatible API;
- the exact error returned by the app's Provider test.

### Provider test returns 401 or 403

Likely causes:

- API key is wrong or expired;
- account has no quota;
- provider requires a different key prefix or project permission;
- Base URL points to the wrong tenant or region.

### Provider test returns 404

Likely causes:

- Base URL is missing `/v1`;
- provider uses a different OpenAI-compatible path;
- provider does not expose the requested endpoint.

### Model not found

Likely causes:

- model ID was typed incorrectly;
- provider exposes a display name but expects a different internal model ID;
- `/models` returns a list, but the selected model is not enabled for the API key.

### Responses test fails but `/models` works

The provider may support model listing and Chat Completions, but not Responses-compatible requests. In the MVP, this is not enough for reliable Codex desktop use.

## Feedback Template

When collecting provider compatibility reports, ask users to provide:

```text
Provider name:
Provider docs link:
Base URL, with sensitive parts redacted:
Model ID:
Does /models work:
Does Provider test pass:
Codex Multi Launcher version:
Codex App version:
Error message:
```

Do not ask users to paste API keys.
