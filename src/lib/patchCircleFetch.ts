/**
 * Workaround for a CORS bug in Circle's Stablecoin Service API.
 *
 * @circle-fin/swap-kit sets an `X-User-Agent` header on every browser-originated
 * request (browsers block scripts from setting the real `User-Agent` header, so
 * the SDK substitutes this one). But api.circle.com's CORS policy for
 * /v1/stablecoinKits/* does not include `x-user-agent` in
 * Access-Control-Allow-Headers, so the browser's preflight rejects every
 * request before it's ever sent — confirmed via the browser console error:
 * "Request header field x-user-agent is not allowed by Access-Control-Allow-Headers
 * in preflight response." This reproduces on every machine/browser/network
 * because it's a server-side CORS misconfiguration on Circle's end, not
 * anything local — curl and server-to-server fetches are unaffected because
 * CORS is a browser-only enforcement mechanism.
 *
 * Until Circle fixes the allowlist, strip the offending header before it
 * reaches the browser's fetch so the preflight only asks for headers Circle's
 * CORS policy actually allows (Authorization, Content-Type, etc).
 */
const PATCHED_MARKER = "__circleFetchPatched";

export function installCircleFetchPatch() {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window.fetch as any)[PATCHED_MARKER]) return;

  const originalFetch = window.fetch.bind(window);

  const patchedFetch: typeof fetch = (input, init) => {
    const url = input instanceof Request ? input.url : input.toString();

    if (url.includes("api.circle.com")) {
      const headers = new Headers(input instanceof Request ? input.headers : init?.headers);
      headers.delete("X-User-Agent");

      if (input instanceof Request) {
        return originalFetch(new Request(input, { headers }));
      }
      return originalFetch(input, { ...init, headers });
    }

    return originalFetch(input, init);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (patchedFetch as any)[PATCHED_MARKER] = true;
  window.fetch = patchedFetch;
}
