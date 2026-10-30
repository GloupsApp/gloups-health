import assert from "node:assert/strict";

import type { EmailMessage } from "@authentication/email-message.contract";
import { test } from "@e2e-dev/mobile";
import { credentials, expect } from "e2e";

test("adult registers, verifies, signs in, relaunches and signs out", async ({
  app,
  device,
  platform,
  screen,
}) => {
  const adult = credentials.user("adult");
  await app.open();

  if (
    platform === "ios" &&
    (await screen.getByRole("button", "Open").isVisible())
  ) {
    await screen.getByRole("button", "Open").tap();
  }

  if (
    platform === "android" &&
    (await screen.getByRole("button", "Allow").isVisible())
  ) {
    await screen.getByRole("button", "Allow").tap();
  }

  await expect(
    screen.getByRole("button", /^Create an account$/iu)
  ).toBeVisible();
  await screen.getByRole("button", /^Create an account$/iu).tap();
  await expect(screen.getByText("Create your account")).toBeVisible();
  await screen.getByRole("textbox", "Email").fill(adult.username);

  if (platform === "ios") {
    // Resolve the native new-password suggestion before XCTest types into the field.
    await screen.getByRole("textbox", "Password").tap();
    await screen.getByRole("button", "Close").tap();
  }

  await screen.getByRole("textbox", "Password").fill(adult.password);
  await (platform === "ios"
    ? screen.getByRole("textbox", "Password").press("Enter")
    : device.dismissKeyboard());
  await screen.getByRole("button", /^Create account$/iu).tap();

  if (platform === "ios") {
    await screen.getByRole("button", "Not Now").tap();
  }

  await expect(screen.getByText("Check your email")).toBeVisible();
  const token = process.env["EMAIL_DELIVERY_TOKEN"];
  assert.ok(token);

  const messages = await fetch("http://127.0.0.1:4346/messages", {
    headers: { authorization: `Bearer ${token}` },
  });

  const emails: EmailMessage[] = await messages.json();

  const message = emails.find(
    (email) =>
      email.recipient === adult.username && email.kind === "verification"
  );

  assert.ok(message, "The real API must deliver a verification email");
  const verification = await fetch(message.url, { redirect: "manual" });
  expect(verification.status).toBe(302);
  expect(verification.headers.get("location")).toBe("gloups-health://verified");
  await device.openLink("gloups-health://verified");

  if (platform === "ios") {
    await expect(
      screen.getByRole("button", /^(?:Open|Sign in)$/iu)
    ).toBeVisible();
  }

  if (
    platform === "ios" &&
    (await screen.getByRole("button", "Open").isVisible())
  ) {
    await screen.getByRole("button", "Open").tap();
  }

  await expect(screen.getByRole("button", /^Sign in$/iu)).toBeVisible();
  await screen.getByRole("textbox", "Email").fill(adult.username);
  await screen.getByRole("textbox", "Password").fill(adult.password);
  await (platform === "ios"
    ? screen.getByRole("textbox", "Password").press("Enter")
    : device.dismissKeyboard());
  await screen.getByRole("button", /^Sign in$/iu).tap();

  if (platform === "ios") {
    await expect(
      screen.getByText("Your account").or(screen.getByRole("button", "Not Now"))
    ).toBeVisible();

    if (await screen.getByRole("button", "Not Now").isVisible()) {
      await screen.getByRole("button", "Not Now").tap();
    }
  }

  await expect(screen.getByText("Your account")).toBeVisible();
  await expect(screen.getByTestId("account-email")).toHaveText(adult.username);
  await app.restart();
  await expect(screen.getByText("Your account")).toBeVisible();
  await expect(screen.getByTestId("account-email")).toHaveText(adult.username);
  await screen.getByRole("button", /^Sign out$/iu).tap();
  await expect(screen.getByRole("button", /^Sign in$/iu)).toBeVisible();
  await app.restart();
  await expect(screen.getByRole("button", /^Sign in$/iu)).toBeVisible();
});
