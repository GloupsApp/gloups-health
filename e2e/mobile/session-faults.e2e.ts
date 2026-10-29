import { afterEach, beforeEach, test } from "@e2e-dev/mobile";
import type { Device } from "@e2e-dev/mobile";
import { expect, secrets } from "e2e";
import type { Screen } from "e2e";

import {
  cleanupLocalIdentities,
  resetLocalBudgets,
  verifiedFixture,
} from "./helpers/native-auth";
import { controlRelay, relayStatus } from "./helpers/relay-control";

const enabled =
  process.env["GLOUPS_AUTH003_NATIVE"] === "1" &&
  process.env["GLOUPS_AUTH003_FAULTS"] === "1";

const options = {
  platforms: ["ios", "android"],
  skip: enabled
    ? false
    : "Requires the owned native build and transparent local fault relay.",
  tags: ["faults"],
  timeout: 180_000,
};

const openSignIn = async (screen: Screen, device: Device): Promise<void> => {
  await device.openLink("gloups-health://sign-in");
  const open = screen.getByRole("button", { exact: true, name: "Open" });

  if (await open.count()) {
    await open.tap();
  }

  await device.openApp("app.gloups.health");
  await expect(screen.getByTestId("sign-in-email")).toBeVisible();
};

const fillSignIn = async (
  screen: Screen,
  device: Device,
  email: string
): Promise<void> => {
  await screen.getByTestId("sign-in-email").fill(email);
  await screen.getByTestId("sign-in-password").fill(secrets.get("password"));
  await device.dismissKeyboard();
  await expect(screen.getByTestId("sign-in-submit")).toBeEnabled();
  await screen.getByTestId("sign-in-submit").tap();
};

beforeEach(async ({ app, screen }) => {
  await controlRelay({ mode: "forward" });
  await resetLocalBudgets();
  await app.open();
  const open = screen.getByRole("button", { exact: true, name: "Open" });

  if (await open.count()) {
    await open.tap();
  }

  const signOut = screen.getByTestId("account-sign-out");

  if (await signOut.count()) {
    await signOut.tap();
  }

  await expect(screen.getByTestId("sign-in-email")).toBeVisible();

  if (
    await screen
      .getByRole("button", { exact: true, name: "Se connecter" })
      .count()
  ) {
    await screen.scrollUntilVisible(screen.getByTestId("language-en"));
    await screen.getByTestId("language-en").tap();
  }
});

afterEach(async ({ device }) => {
  await controlRelay({ mode: "forward" });
  await device.setAirplaneMode(false);
  cleanupLocalIdentities();
});

test(
  "MOBILE-05: a delayed real sign-in response cannot restore cookies after sign-out and another login",
  options,
  async ({ screen, device, app }) => {
    const first = await verifiedFixture();
    const second = await verifiedFixture();
    await resetLocalBudgets();
    await controlRelay({ mode: "hold-next", path: "/api/auth/sign-in/email" });
    await fillSignIn(screen, device, first.email);
    await expect
      .poll(async () => {
        const status = await relayStatus();

        return status.heldCount;
      })
      .toBe(1);
    await screen.getByTestId("pending-sign-out").tap();
    await fillSignIn(screen, device, second.email);
    await expect(screen.getByText(second.email, { exact: true })).toBeVisible();
    await controlRelay({ mode: "release" });
    await app.restart();
    await expect(screen.getByText(second.email, { exact: true })).toBeVisible();
    await expect(
      screen.getByText(first.email, { exact: true })
    ).not.toBeVisible();
  }
);

test(
  "MOBILE-04/05: delayed account data from a foreground check cannot replace the next account",
  options,
  async ({ screen, device, app }) => {
    const first = await verifiedFixture();
    const second = await verifiedFixture();
    await resetLocalBudgets();
    await fillSignIn(screen, device, first.email);
    await expect(screen.getByText(first.email, { exact: true })).toBeVisible();
    await controlRelay({ mode: "hold-next", path: "/api/me" });
    await device.home();
    await device.openApp("app.gloups.health");
    await expect
      .poll(async () => {
        const status = await relayStatus();

        return status.heldCount;
      })
      .toBe(1);
    await openSignIn(screen, device);
    await fillSignIn(screen, device, second.email);
    await expect(screen.getByText(second.email, { exact: true })).toBeVisible();
    await controlRelay({ mode: "release" });
    await app.restart();
    await expect(screen.getByText(second.email, { exact: true })).toBeVisible();
    await expect(
      screen.getByText(first.email, { exact: true })
    ).not.toBeVisible();
  }
);

test(
  "MOBILE-03: an actual transport cut on foreground removes protected UI until server revalidation",
  options,
  async ({ screen, device }) => {
    const user = await verifiedFixture();
    await fillSignIn(screen, device, user.email);
    await expect(screen.getByTestId("account-screen")).toBeVisible();
    await controlRelay({ mode: "cut" });
    await device.home();
    await device.openApp("app.gloups.health");
    await expect(screen.getByTestId("session-retry")).toBeVisible({
      timeout: 20_000,
    });
    await expect(screen.getByTestId("account-screen")).not.toBeVisible();
    await controlRelay({ mode: "forward" });
    await screen.getByTestId("session-retry").tap();
    await expect(screen.getByText(user.email, { exact: true })).toBeVisible();
  }
);

test(
  "MOBILE-03/05: Android offline sign-out clears access without promising remote revocation",
  {
    ...options,
    platforms: ["android"],
  },
  async ({ screen, device, app }) => {
    const user = await verifiedFixture();
    await fillSignIn(screen, device, user.email);
    await expect(screen.getByTestId("account-screen")).toBeVisible();
    await controlRelay({ mode: "cut" });
    await device.setAirplaneMode(true);
    await expect(screen.getByTestId("session-sign-out")).toBeVisible({
      timeout: 20_000,
    });
    await screen.getByTestId("session-sign-out").tap();
    await expect(
      screen.getByText(
        "You’re signed out on this device. Remote sign-out could not be confirmed.",
        { exact: true }
      )
    ).toBeVisible({ timeout: 20_000 });
    await controlRelay({ mode: "forward" });
    await device.setAirplaneMode(false);
    await app.restart();
    await expect(screen.getByTestId("sign-in-email")).toBeVisible();
    await expect(screen.getByTestId("account-screen")).not.toBeVisible();
  }
);
