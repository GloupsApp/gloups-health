// The pinned React Native fetch polyfill is untyped JavaScript. Its public
// exports implement the platform Fetch API used by the client under test.
declare module "whatwg-fetch" {
  export const fetch: typeof globalThis.fetch;
  export const Headers: typeof globalThis.Headers;
  export const Request: typeof globalThis.Request;
  export const Response: typeof globalThis.Response;
}
