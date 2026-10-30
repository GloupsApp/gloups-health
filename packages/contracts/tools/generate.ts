import { mkdir, writeFile } from "node:fs/promises";

import { createClient } from "@hey-api/openapi-ts";
import { z } from "zod";

import { accountViewSchema, apiErrorSchema } from "../src/index.ts";

const jsonResponse = (description: string, schema: { $ref: string }) => ({
  content: { "application/json": { schema } },
  description,
});

const errorResponse = jsonResponse("Request failed", {
  $ref: "#/components/schemas/ApiError",
});

const document = {
  components: {
    schemas: {
      AccountView: z.toJSONSchema(accountViewSchema),
      ApiError: z.toJSONSchema(apiErrorSchema),
    },
    securitySchemes: {
      session: { in: "cookie", name: "gloups.session_token", type: "apiKey" },
    },
  },
  info: { title: "Gloups Account API", version: "1.0.0" },
  openapi: "3.1.0",
  paths: {
    "/api/me": {
      get: {
        operationId: "getCurrentAccount",
        responses: {
          "200": jsonResponse("Current account", {
            $ref: "#/components/schemas/AccountView",
          }),
          "400": errorResponse,
          "401": errorResponse,
          "403": errorResponse,
          "503": errorResponse,
        },
        security: [{ session: [] }],
        summary: "Retrieve the account owned by the verified session",
      },
    },
  },
};

await mkdir(new URL("../generated", import.meta.url), { recursive: true });

await writeFile(
  new URL("../generated/openapi.json", import.meta.url),
  `${JSON.stringify(document, null, 2)}\n`
);

await createClient({
  input: document,
  output: { importFileExtension: ".js", path: "generated/client" },
  plugins: [
    "@hey-api/typescript",
    "@hey-api/client-fetch",
    { compatibilityVersion: 4, name: "zod" },
    { name: "@hey-api/sdk", validator: { request: true, response: true } },
  ],
});
