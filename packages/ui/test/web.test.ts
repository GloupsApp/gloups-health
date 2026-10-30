import { mock, test } from "bun:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as ReactNativeWeb from "react-native-web";

// Use the real web adapter, matching a web consumer's bundler alias.
mock.module("react-native", () => ReactNativeWeb);

const { Heading } = await import("@gloups/ui");

test("the compiled UI package renders an accessible heading through React Native Web", () => {
  const html = renderToStaticMarkup(
    createElement(Heading, { testID: "account-heading" }, "Your account")
  );

  assert.match(html, /role="heading"/u);
  assert.match(html, /data-testid="account-heading"/u);
  assert.match(html, /Your account/u);
});
