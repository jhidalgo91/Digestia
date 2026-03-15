import { NextRequest } from "next/server";

export function buildRequest(
  url: string,
  options?: { method?: string; body?: unknown; searchParams?: Record<string, string> }
): NextRequest {
  const { method = "GET", body, searchParams } = options ?? {};
  let fullUrl = `http://localhost${url}`;
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    fullUrl += `?${params.toString()}`;
  }
  return new NextRequest(fullUrl, {
    method,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
  });
}
