export type SourceRole =
  | "configuration"
  | "contract"
  | "handler"
  | "integration"
  | "message"
  | "model"
  | "operation"
  | "port"
  | "query"
  | "read-port"
  | "repository"
  | "transport"
  | "wiring";

export interface FeaturePolicy {
  name: string;
  root: string;
  files: Readonly<Record<string, SourceRole>>;
  publicFiles: Readonly<Record<string, readonly string[]>>;
  providerExports: Readonly<Record<string, readonly string[]>>;
  frameworkModules?: Readonly<Record<string, readonly string[]>>;
}

/** File responsibilities are explicit; changing a directory name never grants access. */
export const apiFeatures: readonly FeaturePolicy[] = [
  {
    files: {
      "config.ts": "configuration",
      "health.controller.ts": "transport",
      "http-errors.filter.ts": "transport",
      "main.ts": "wiring",
      "migrate.ts": "wiring",
    },
    frameworkModules: { "@nestjs/cqrs": ["CqrsModule"] },
    name: "api",
    providerExports: { AppModule: [] },
    publicFiles: { "config.ts": ["ApiConfig", "readConfig"] },
    root: ".",
  },
  {
    files: {
      "auth-rate-limit.schema.ts": "integration",
      "database.ts": "integration",
      "public.ts": "integration",
      "schema.ts": "integration",
    },
    name: "database",
    providerExports: {},
    publicFiles: {
      "public.ts": [
        "Database",
        "authSchema",
        "createDatabase",
        "gloupsAccount",
      ],
    },
    root: "database",
  },
  {
    files: {
      "identity-access.module.ts": "wiring",
      "public.ts": "contract",
    },
    name: "identity-access",
    providerExports: { IdentityAccessModule: [] },
    publicFiles: { "public.ts": ["createIdentityAccess"] },
    root: "modules/identity-access",
  },
  {
    files: {
      "authentication-http.port.ts": "transport",
      "authentication.module.ts": "wiring",
      "email-message.contract.ts": "transport",
      "identity-sessions.port.ts": "port",
      "integrations/better-auth/auth-http.ts": "integration",
      "integrations/better-auth/auth.ts": "integration",
      "integrations/better-auth/sessions.ts": "integration",
      "integrations/email/http-email.delivery.ts": "integration",
      "public.ts": "contract",
    },
    name: "authentication",
    providerExports: {
      AuthenticationModule: ["AUTHENTICATION_HTTP", "IDENTITY_SESSIONS"],
    },
    publicFiles: {
      "authentication.module.ts": ["AuthenticationModule"],
      "email-message.contract.ts": ["EmailMessage", "emailMessageSchema"],
      "public.ts": [
        "AUTHENTICATION_HTTP",
        "AuthenticationHttpHandler",
        "IDENTITY_SESSIONS",
        "IdentitySessions",
        "VerifiedIdentity",
      ],
    },
    root: "modules/identity-access/authentication",
  },
  {
    files: {
      "account-access-error.ts": "model",
      "account-admission.guard.ts": "transport",
      "account-reader.port.ts": "read-port",
      "account-repository.port.ts": "port",
      "accounts.controller.ts": "transport",
      "accounts.module.ts": "wiring",
      "commands/resolve-account.command.ts": "message",
      "commands/resolve-account.handler.ts": "handler",
      "commands/resolve-account.service.ts": "operation",
      "current-account.ts": "model",
      "drizzle-account.repository.ts": "repository",
      "gloups-account.ts": "model",
      "public.ts": "contract",
      "queries/get-current-account.handler.ts": "handler",
      "queries/get-current-account.query.ts": "message",
      "queries/get-current-account.service.ts": "query",
    },
    name: "accounts",
    providerExports: { AccountsModule: [] },
    publicFiles: {
      "accounts.module.ts": ["AccountsModule"],
      "public.ts": ["AccountAccessError"],
    },
    root: "modules/identity-access/accounts",
  },
];
