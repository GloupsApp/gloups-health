import type { IncomingHttpHeaders } from "node:http";

import { Inject, Injectable } from "@nestjs/common";

import type {
  AppleChallengeInput,
  NativeAppleInput,
} from "../../application/native-apple-input.js";
import { APPLE_NATIVE } from "./apple-native.js";
import type { NativeApple } from "./apple-native.js";
import { APPLE_NOTIFICATIONS } from "./apple-notifications.js";
import type { AppleNotifications } from "./apple-notifications.js";
import { trustedAuthHeaders } from "./better-auth.gateway.js";

@Injectable()
export class AppleHttpGateway {
  private readonly native: NativeApple;
  private readonly notifications: AppleNotifications;
  constructor(
    @Inject(APPLE_NATIVE) native: NativeApple,
    @Inject(APPLE_NOTIFICATIONS) notifications: AppleNotifications
  ) {
    this.native = native;
    this.notifications = notifications;
  }
  challenge(
    input: AppleChallengeInput,
    headers: IncomingHttpHeaders,
    ip: string
  ) {
    return this.native.challenge(input, trustedAuthHeaders(headers, ip));
  }
  complete(
    input: NativeAppleInput,
    headers: IncomingHttpHeaders,
    ip: string
  ): Promise<Response> {
    return this.native.complete(input, trustedAuthHeaders(headers, ip));
  }
  notify(payload: string): Promise<void> {
    return this.notifications.process(payload);
  }
}
