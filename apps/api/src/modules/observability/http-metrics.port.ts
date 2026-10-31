import type { IncomingMessage, ServerResponse } from "node:http";

export type ObserveHttpRequest = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void
) => void;

export const HTTP_METRICS = Symbol("HTTP_METRICS");
