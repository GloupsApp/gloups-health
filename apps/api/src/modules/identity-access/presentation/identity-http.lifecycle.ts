import { Inject, Injectable } from "@nestjs/common";
import type { OnModuleInit } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import type { FastifyInstance } from "fastify";

import { API_CONFIG } from "../../../config.js";
import type { ApiConfig } from "../../../config.js";
import { BetterAuthGateway } from "../infrastructure/auth/better-auth.gateway.js";
import { registerAuthHttp } from "./auth-http.plugin.js";

@Injectable()
export class IdentityHttpLifecycle implements OnModuleInit {
  private readonly adapter: HttpAdapterHost;
  private readonly gateway: BetterAuthGateway;
  private readonly config: ApiConfig;
  constructor(
    @Inject(HttpAdapterHost) adapter: HttpAdapterHost,
    @Inject(BetterAuthGateway) gateway: BetterAuthGateway,
    @Inject(API_CONFIG) config: ApiConfig
  ) {
    this.adapter = adapter;
    this.gateway = gateway;
    this.config = config;
  }
  async onModuleInit(): Promise<void> {
    const instance = this.adapter.httpAdapter.getInstance<FastifyInstance>();
    await registerAuthHttp(instance, this.gateway, this.config);
  }
}
