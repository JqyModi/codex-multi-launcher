import type { ProviderTestInput, ProviderTestResult } from "../shared/types.js";

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
