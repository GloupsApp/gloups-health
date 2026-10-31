# Mobile conventions

- Use the installed Expo and React Native versions and compatible native modules. Import shared presentation primitives and colors from `@gloups/ui`.
- Keep authentication, account state, navigation, and platform I/O in the application. Use `@gloups/contracts/client` for Gloups HTTP calls and Better Auth's Expo client for authentication.
- Session credentials belong in SecureStore through the Expo adapter. Use `credentials: "omit"` and the adapter's cookies rather than the platform cookie jar.
- Preserve session retirement checks before credentials can be persisted, server revalidation on foreground, and verified local credential clearing on sign-out. Recovery links must support cancelling and reopening the form.
- Require `EXPO_PUBLIC_API_URL`; release builds require HTTPS. Keep development and production credential namespaces distinct.
- Use the shared strict Expo compiler preset and React/React Native lint profiles. Keep color literals in the shared UI token module.
- Do not hand-edit ignored native build directories. Use Expo tooling when a task requires regenerating native projects.

For changed mobile behavior, validation includes `bun run test:mobile:unit`, mobile typechecking, and `bun run mobile:build`. Native acceptance follows [../../e2e/AGENTS.md](../../e2e/AGENTS.md); setup and device commands live in [../../README.md](../../README.md). The assigned validation owner runs the needed checks once.
