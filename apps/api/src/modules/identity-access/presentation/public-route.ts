import { SetMetadata } from "@nestjs/common";

export const PUBLIC_ROUTE = Symbol("PUBLIC_ROUTE");
export const PublicRoute = () => SetMetadata(PUBLIC_ROUTE, true);

export const IDENTITY_ONLY_ROUTE = Symbol("IDENTITY_ONLY_ROUTE");
export const IdentityOnlyRoute = () => SetMetadata(IDENTITY_ONLY_ROUTE, true);
