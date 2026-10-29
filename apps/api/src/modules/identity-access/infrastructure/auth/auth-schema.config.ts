import { betterAuth } from "better-auth";

import { authSchemaOptions } from "./auth-options.js";

export const auth = betterAuth(authSchemaOptions);
