import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_ROUTE = Symbol("IS_PUBLIC_ROUTE");

/** An explicit endpoint policy for infrastructure probes that require anonymous access. */
export const Public = () => SetMetadata(IS_PUBLIC_ROUTE, true);
