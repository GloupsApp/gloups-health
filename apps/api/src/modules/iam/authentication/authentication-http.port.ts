import type { NodeRequest, NodeResponse } from "@nestjs/platform-node";

export type AuthenticationHttpHandler = (
  request: NodeRequest,
  response: NodeResponse,
  next: () => void
) => Promise<void>;

export const AUTHENTICATION_HTTP = Symbol("AUTHENTICATION_HTTP");
