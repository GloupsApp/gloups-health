# Universal UI

`@gloups/ui` contains presentation primitives shared by Expo and React Native Web. It currently exports `Heading`, `HeadingProps`, and `colors`. The account and authentication screens consume the same heading and palette.

```tsx
import { colors, Heading } from "@gloups/ui";

<Heading>Your account</Heading>;
```

The package owns no account state, authentication, navigation, network calls, or storage. Keep business features in their owning application. React and React Native are peer dependencies, provided by the consuming app, so the library does not bundle another React runtime.

`Heading` declares its client boundary for React Server Component consumers. The colour tokens remain plain data in their own module.

`bun run --filter @gloups/ui build` emits ESM and declarations under `dist`; `tsc-alias` supplies extensions for emitted relative imports. The `types` and default exports use those artifacts. The `react-native` export points Metro at source for development updates. Turbo builds the package before its consumers, including when invoked with the mobile filter. Modern Expo discovers workspace packages automatically; no legacy Metro watch-folder override is required.

Web consumers install compatible React, React DOM, and React Native Web versions and alias `react-native` to `react-native-web` in their bundler. React Native Web is an optional peer; it is installed for the package's web check alongside React DOM. This is the universal-component pattern from the [Turborepo React Native Web example](https://github.com/vercel/turborepo/tree/main/examples/with-react-native-web). The `apps/web` directory currently has no application; the shared package does not create a new web product.

`bun run ui:test:web` builds the package through Turbo and renders its compiled export through the real React Native Web adapter. The check verifies the heading role, text, and forwarded test identifier. CI runs it alongside the API and mobile checks.

The web check is TypeScript. The package typecheck verifies production source separately from its test project, including the web check and local lint configuration. Test-only source resolution allows checking a fresh checkout before build artifacts exist; the runtime check still imports the compiled package export.

Use the React Native library compiler preset and the React/React Native lint profiles. Keep platform APIs out of shared primitives; introduce platform-specific files when a real component needs them.
