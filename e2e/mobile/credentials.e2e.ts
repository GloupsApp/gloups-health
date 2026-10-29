import { afterEach, beforeEach, test } from "@e2e-dev/mobile";
import type { Device } from "@e2e-dev/mobile";
import type { Screen } from "e2e";
import { expect, secrets } from "e2e";

import {
  cleanupLocalIdentities,
  consumeEmailLink,
  deliverPrivateLink,
  emailReceipt,
  protectedStatus,
  resetLocalBudgets,
  syntheticEmail,
  verifiedFixture,
} from "./helpers/native-auth";

const nativeBuild = process.env["GLOUPS_AUTH003_NATIVE"] === "1";

const options = {
  platforms: ["ios", "android"],
  skip: nativeBuild
    ? false
    : "Custom callback scheme requires the local native build.",
  tags: ["native"],
  timeout: 180_000,
};

const acceptOpenPrompt = async (screen: Screen): Promise<void> => {
  const open = screen.getByRole("button", { exact: true, name: "Open" });

  if (await open.count()) {
    await open.tap();
  }
};

const openRoute = async (
  device: Device,
  screen: Screen,
  url: string
): Promise<void> => {
  await device.openLink(url);
  await acceptOpenPrompt(screen);
  await device.openApp("app.gloups.health");
  await acceptOpenPrompt(screen);
};

beforeEach(async ({ app, screen }) => {
  await resetLocalBudgets();
  await app.open();
  await acceptOpenPrompt(screen);
  const signOut = screen.getByTestId("account-sign-out");

  if (await signOut.count()) {
    await signOut.tap();
  }

  await expect(screen.getByTestId("sign-in-email")).toBeVisible({
    timeout: 30_000,
  });

  if (
    await screen
      .getByRole("button", { exact: true, name: "Se connecter" })
      .count()
  ) {
    await screen.scrollUntilVisible(screen.getByTestId("language-en"));
    await screen.getByTestId("language-en").tap();
  }
});

afterEach(() => {
  cleanupLocalIdentities();
});

test(
  "MOBILE-02: registration, validation, unverified denial and French verification return",
  options,
  async ({ screen, device }) => {
    const email = syntheticEmail();
    await screen.getByText("Create account", { exact: true }).tap();
    await screen.getByTestId("sign-up-name").fill("李 · Élodie 🌿");
    await screen.getByTestId("sign-up-email").fill(email);
    await screen
      .getByTestId("sign-up-password")
      .fill(secrets.get("shortPassword"));
    await device.dismissKeyboard();
    await screen.getByTestId("sign-up-submit").tap();
    await expect(
      screen.getByText("Check the details and try again.", { exact: true })
    ).toBeVisible();
    await screen.getByTestId("sign-up-password").fill(secrets.get("password"));
    await device.dismissKeyboard();
    await screen.scrollUntilVisible(screen.getByTestId("language-fr"));
    await screen.getByTestId("language-fr").tap();
    await screen.scrollUntilVisible(screen.getByTestId("sign-up-submit"), {
      direction: "up",
    });
    await screen.getByTestId("sign-up-submit").tap();
    await expect(screen.getByTestId("verification-email")).toBeVisible();
    const receipt = await emailReceipt(email, "verify-email");
    expect(receipt.language).toBe("fr");
    await openRoute(device, screen, "gloups-health://sign-in");
    await screen.getByTestId("sign-in-email").fill(email);
    await screen.getByTestId("sign-in-password").fill(secrets.get("password"));
    await device.dismissKeyboard();
    await screen.getByTestId("sign-in-submit").tap();
    await expect(
      screen.getByText("Vérifiez votre e-mail avant de vous connecter.", {
        exact: true,
      })
    ).toBeVisible();
    await expect(screen.getByTestId("account-screen")).not.toBeVisible();
    const callback = await consumeEmailLink(email, "verify-email");
    expect(new URL(callback).searchParams.has("token")).toBe(false);
    await openRoute(device, screen, callback);
    await expect(screen.getByTestId("sign-in-email")).toBeVisible();
    await screen.getByTestId("sign-in-email").fill(email);
    await screen.getByTestId("sign-in-password").fill(secrets.get("password"));
    await device.dismissKeyboard();
    await screen.getByTestId("sign-in-submit").tap();
    await expect(screen.getByTestId("account-screen")).toBeVisible();
    await expect(
      screen.getByText("李 · Élodie 🌿", { exact: true })
    ).toBeVisible();
  }
);

test(
  "MOBILE-03: cold password recovery clears the old account and revokes existing sessions",
  options,
  async ({ screen, device, platform }) => {
    const user = await verifiedFixture();
    await screen.getByTestId("sign-in-email").fill(user.email);
    await screen.getByTestId("sign-in-password").fill(secrets.get("password"));
    await device.dismissKeyboard();
    await screen.getByTestId("sign-in-submit").tap();
    await expect(screen.getByTestId("account-screen")).toBeVisible();
    await openRoute(device, screen, "gloups-health://forgot-password");
    await screen.getByTestId("recovery-email").fill(user.email);
    await device.dismissKeyboard();
    await screen.getByTestId("recovery-submit").tap();
    await expect(
      screen.getByText(
        "If an account uses this email, a password reset link is on its way.",
        { exact: true }
      )
    ).toBeVisible();
    const link = await consumeEmailLink(user.email, "reset-password");
    await device.closeApp();
    deliverPrivateLink(platform, link);
    await device.openApp("app.gloups.health");
    await acceptOpenPrompt(screen);
    await expect(screen.getByTestId("reset-password")).toBeVisible();
    await screen
      .getByTestId("reset-password")
      .fill(secrets.get("nextPassword"));
    await device.dismissKeyboard();
    await screen.getByTestId("reset-submit").tap();
    await expect(screen.getByTestId("sign-in-email")).toBeVisible();
    expect(await protectedStatus(user.cookie)).toBe(401);
    await screen.getByTestId("sign-in-email").fill(user.email);
    await screen
      .getByTestId("sign-in-password")
      .fill(secrets.get("nextPassword"));
    await device.dismissKeyboard();
    await screen.getByTestId("sign-in-submit").tap();
    await expect(screen.getByTestId("account-screen")).toBeVisible();
  }
);

test(
  "MOBILE-04: durable session, account switching, last method and sign-out survive relaunch",
  options,
  async ({ screen, app, device }) => {
    const first = await verifiedFixture();
    const second = await verifiedFixture();
    await resetLocalBudgets();
    await screen.getByTestId("sign-in-email").fill(first.email);
    await screen.getByTestId("sign-in-password").fill(secrets.get("password"));
    await device.dismissKeyboard();
    await screen.getByTestId("sign-in-submit").tap();
    await expect(screen.getByTestId("account-screen")).toBeVisible();
    await app.restart();
    await expect(screen.getByText(first.email, { exact: true })).toBeVisible();
    await openRoute(device, screen, "gloups-health://sign-in");
    await screen.getByTestId("sign-in-email").fill(second.email);
    await screen.getByTestId("sign-in-password").fill(secrets.get("password"));
    await device.dismissKeyboard();
    await screen.getByTestId("sign-in-submit").tap();
    await expect(screen.getByText(second.email, { exact: true })).toBeVisible();
    await expect(
      screen.getByText(first.email, { exact: true })
    ).not.toBeVisible();
    await screen.getByTestId("account-methods").tap();
    await expect(screen.getByTestId("method-credential")).toBeVisible();
    await screen.getByTestId("method-credential").tap();
    await expect(
      screen.getByText("Keep at least one sign-in method on your account.", {
        exact: true,
      })
    ).toBeVisible();
    await device.alert("accept");
    await openRoute(device, screen, "gloups-health://");
    await expect(screen.getByTestId("account-screen")).toBeVisible();
    await screen.getByTestId("account-sign-out").tap();
    await expect(screen.getByTestId("sign-in-email")).toBeVisible();
    await app.restart();
    await expect(screen.getByTestId("sign-in-email")).toBeVisible();
    await expect(screen.getByTestId("account-screen")).not.toBeVisible();
  }
);

test(
  "MOBILE-08: confirmed deletion clears local access and denies another session",
  options,
  async ({ screen, device, app }) => {
    const user = await verifiedFixture();
    await screen.getByTestId("sign-in-email").fill(user.email);
    await screen.getByTestId("sign-in-password").fill(secrets.get("password"));
    await device.dismissKeyboard();
    await screen.getByTestId("sign-in-submit").tap();
    await expect(screen.getByTestId("account-screen")).toBeVisible();
    await screen.getByTestId("account-delete").tap();
    await screen.getByTestId("delete-confirm").tap();
    await screen
      .getByRole("button", { exact: true, name: "Delete my account" })
      .tap();
    await expect(screen.getByTestId("deletion-result-screen")).toBeVisible();
    await expect(
      screen.getByText("Your account is closed. Gloups deletion is pending.", {
        exact: true,
      })
    ).toBeVisible();
    expect(await protectedStatus(user.cookie)).toBe(401);
    await app.restart();
    await expect(screen.getByTestId("sign-in-email")).toBeVisible();
    await expect(screen.getByTestId("account-screen")).not.toBeVisible();
  }
);
