# Universal UI conventions

- Keep this package limited to presentation primitives and shared tokens. Authentication, account state, navigation, networking, and storage belong to the consuming application.
- Use React Native primitives that also work through React Native Web. Keep React and React Native as peers; preserve React Native Web as an optional peer.
- Keep color literals in the token module. Preserve accessibility semantics and forwarded component props such as test identifiers.
- Preserve the React Native source export for Metro and compiled ESM/declaration exports for other consumers. Mark components' client boundary where React Server Component consumers require it.
- Use the shared React Native library compiler preset and React/React Native lint profiles. Follow [README.md](README.md) for platform-specific files and web adapter setup.

The validation owner uses `bun run ui:test:web`, UI typechecking, and affected mobile checks. The web check must exercise the compiled package through the real React Native Web adapter.
