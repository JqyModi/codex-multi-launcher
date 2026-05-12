import type { ProviderModelOption, ProviderModelsInput, ProviderModelsResult, ProviderTestInput, ProviderTestResult } from "../shared/types.js";

const REQUEST_TIMEOUT_MS = 15000;

function normalizeBaseUrl(rawBaseUrl: string): URL | null {
  try {
    const url = new URL(rawBaseUrl.trim());
    if (!["https:", "http:"].includes(url.protocol)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function endpoint(baseUrl: URL, suffix: string): string {
  const pathname = baseUrl.pathname.replace(/\/+$/, "");
  return new URL(`${pathname}${suffix}`, baseUrl).toString();
}

function errorResult(status: ProviderTestResult["status"], summary: string, details: string, extra: Partial<ProviderTestResult> = {}): ProviderTestResult {
  return {
    status,
    ok: false,
    summary,
    details,
    testedModelsEndpoint: false,
    testedResponsesEndpoint: false,
    ...extra
  };
}

function modelErrorResult(status: ProviderModelsResult["status"], summary: string, details: string, extra: Partial<ProviderModelsResult> = {}): ProviderModelsResult {
  return {
    status,
    ok: false,
    summary,
    details,
    models: [],
    ...extra
  };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function extractModelOptions(payload: unknown): ProviderModelOption[] {
  const seen = new Set<string>();
  const models: ProviderModelOption[] = [];
  const visited = new Set<object>();
  const queue: unknown[] = [payload];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") {
      continue;
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    if (Array.isArray(current)) {
      const candidateModels = current
        .map((item) => modelOptionFromUnknown(item))
        .filter((item): item is ProviderModelOption => Boolean(item));

      if (candidateModels.length > 0) {
        for (const model of candidateModels) {
          if (seen.has(model.id)) {
            continue;
          }
          seen.add(model.id);
          models.push(model);
        }
      }

      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    for (const value of Object.values(current)) {
      queue.push(value);
    }
  }

  return models;
}

function modelOptionFromUnknown(value: unknown): ProviderModelOption | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== "string" || !record.id.trim()) {
    return null;
  }

  const displayName = [record.display_name, record.name, record.label].find((item): item is string => typeof item === "string" && item.trim().length > 0);
  return {
    id: record.id.trim(),
    ...(displayName ? { displayName: displayName.trim() } : {})
  };
}

export async function listProviderModels(input: ProviderModelsInput): Promise<ProviderModelsResult> {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  if (!baseUrl) {
    return modelErrorResult("invalid_url", "Invalid Base URL", "Base URL must be a valid http or https URL.");
  }

  if (!input.apiKey.trim()) {
    return modelErrorResult("auth_failed", "Missing API key", "Enter an API key before fetching models.");
  }

  const headers = {
    Authorization: `Bearer ${input.apiKey}`,
    "Content-Type": "application/json"
  };

  try {
    const response = await fetchWithTimeout(endpoint(baseUrl, "/models"), {
      method: "GET",
      headers
    });

    if (response.status === 401 || response.status === 403) {
      return modelErrorResult("auth_failed", "Authentication failed", "The provider rejected the API key.", {
        httpStatus: response.status
      });
    }

    if (!response.ok) {
      const body = await response.text();
      return modelErrorResult("unknown_error", "Model list unavailable", body.slice(0, 800) || response.statusText, {
        httpStatus: response.status
      });
    }

    const payload = await response.json();
    const models = extractModelOptions(payload);
    if (models.length === 0) {
      return modelErrorResult("no_models", "No models found", "The /models response did not contain an array of objects with string id fields.", {
        httpStatus: response.status
      });
    }

    return {
      status: "passed",
      ok: true,
      summary: `${models.length} models found`,
      details: "Select one below, or keep typing a model name manually.",
      models,
      httpStatus: response.status
    };
  } catch (error) {
    return modelErrorResult("unreachable", "Provider unreachable", error instanceof Error ? error.message : "Could not connect to /models.");
  }
}

export async function testProvider(input: ProviderTestInput): Promise<ProviderTestResult> {
  const baseUrl = normalizeBaseUrl(input.baseUrl);
  if (!baseUrl) {
    return errorResult("invalid_url", "Invalid Base URL", "Base URL must be a valid http or https URL.");
  }

  if (!input.apiKey.trim()) {
    return errorResult("auth_failed", "Missing API key", "Enter an API key before testing the provider.");
  }

  const headers = {
    Authorization: `Bearer ${input.apiKey}`,
    "Content-Type": "application/json"
  };

  try {
    const modelsResponse = await fetchWithTimeout(endpoint(baseUrl, "/models"), {
      method: "GET",
      headers
    });

    if (modelsResponse.status === 401 || modelsResponse.status === 403) {
      return errorResult("auth_failed", "Authentication failed", "The provider rejected the API key.", {
        testedModelsEndpoint: true,
        httpStatus: modelsResponse.status
      });
    }
  } catch (error) {
    return errorResult("unreachable", "Provider unreachable", error instanceof Error ? error.message : "Could not connect to the provider.", {
      testedModelsEndpoint: true
    });
  }

  try {
    const responsesResponse = await fetchWithTimeout(endpoint(baseUrl, "/responses"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: input.model,
        input: "Respond with ok."
      })
    });

    if (responsesResponse.ok) {
      return {
        status: "passed",
        ok: true,
        summary: "Responses API is available",
        details: "The provider accepted a minimal /responses request.",
        testedModelsEndpoint: true,
        testedResponsesEndpoint: true,
        httpStatus: responsesResponse.status
      };
    }

    if (responsesResponse.status === 401 || responsesResponse.status === 403) {
      return errorResult("auth_failed", "Authentication failed", "The provider rejected the API key during the Responses API test.", {
        testedModelsEndpoint: true,
        testedResponsesEndpoint: true,
        httpStatus: responsesResponse.status
      });
    }

    if (responsesResponse.status === 404 || responsesResponse.status === 405) {
      return errorResult("responses_unsupported", "Responses API unsupported", "The provider does not appear to support /responses.", {
        testedModelsEndpoint: true,
        testedResponsesEndpoint: true,
        httpStatus: responsesResponse.status
      });
    }

    const body = await responsesResponse.text();
    return errorResult("unknown_error", "Responses API test failed", body.slice(0, 800) || responsesResponse.statusText, {
      testedModelsEndpoint: true,
      testedResponsesEndpoint: true,
      httpStatus: responsesResponse.status
    });
  } catch (error) {
    return errorResult("unreachable", "Responses API unreachable", error instanceof Error ? error.message : "Could not connect to /responses.", {
      testedModelsEndpoint: true,
      testedResponsesEndpoint: true
    });
  }
}
