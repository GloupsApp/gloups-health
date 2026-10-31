import { setTimeout as delay } from "node:timers/promises";

import { test } from "@e2e-dev/mobile";
import { expect } from "e2e";

test(
  "provider cancellation, explicit linking, last-method protection, removal and recovery failure",
  {
    skip: process.env["GLOUPS_PROVIDER_FIXTURE"] !== "1",
    timeout: 240_000,
  },
  async ({ app, device, platform, screen }) => {
    await app.open();

    const button = (label: string) =>
      screen.getByRole(
        "button",
        new RegExp(
          `^${label.replaceAll(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`,
          "iu"
        )
      );

    const openProvider = async (label: string, action: string) => {
      await screen.scrollUntilVisible(button(label), {
        direction: "up",
      });
      await button(label).tap();

      if (platform === "ios") {
        await expect(
          screen.getByRole("button", "Continue").or(button(action))
        ).toBeVisible();

        if (await button("Continue").isVisible()) {
          await button("Continue").tap();
          await delay(1000);
        }
      } else {
        await expect(
          button("Stay signed out").or(button(action))
        ).toBeVisible();

        if (await button("Stay signed out").isVisible()) {
          await button("Stay signed out").tap();
        }
      }

      await expect(button(action)).toBeVisible();
      await button(action).tap();
      // Let the system authentication sheet finish dismissing before XCTest reads its clip tree.
      await delay(1000);

      if (platform === "ios") {
        await device.openApp("health.gloups.mobile", { relaunch: false });
      }
    };

    await openProvider("Continue with Google", "Cancel provider");
    await expect(
      screen.getByText(
        "Sign-in was cancelled. Try again or use another linked method."
      )
    ).toBeVisible();
    await openProvider("Continue with Apple", "Use synthetic Apple");
    await expect(screen.getByText("Your account")).toBeVisible();
    const email = await screen.getByTestId("account-email").textContent();
    await button("Remove Apple").tap();
    await screen.scrollUntilVisible(button("Confirm removal"));
    await button("Confirm removal").tap();
    await screen.scrollUntilVisible(
      screen.getByText(
        "Add another available sign-in method before removing this one."
      )
    );
    await expect(
      screen.getByText(
        "Add another available sign-in method before removing this one."
      )
    ).toBeVisible();
    await screen.scrollUntilVisible(button("Keep method"), {
      direction: "up",
    });
    await button("Keep method").tap();
    await openProvider("Link Google", "Use synthetic Google");
    await screen.scrollUntilVisible(button("Remove Google"), {
      direction: "up",
    });
    await expect(button("Remove Google")).toBeVisible();
    await app.restart();
    await expect(screen.getByText("Your account")).toBeVisible();
    await button("Remove Apple").tap();
    await screen.scrollUntilVisible(button("Confirm removal"));
    await button("Confirm removal").tap();
    await expect(button("Continue with Google")).toBeVisible();
    await openProvider("Continue with Google", "Use synthetic Google");
    await expect(screen.getByTestId("account-email")).toHaveText(email ?? "");
    await screen.getByRole("button", /^Sign out$/iu).tap();
    await button("Forgot password?").tap();
    await screen.getByRole("textbox", "Email").fill(email ?? "");
    await (platform === "ios"
      ? screen.getByRole("textbox", "Email").press("Enter")
      : device.dismissKeyboard());
    await button("Send reset link").tap();
    await expect(
      screen.getByText(
        "If this email has a password, a reset link is on its way."
      )
    ).toBeVisible();
    await device.openLink("gloups-health://reset-password?error=INVALID_TOKEN");

    if (platform === "ios") {
      await expect(
        button("Open").or(
          screen.getByText("This reset link has expired. Request a new link.")
        )
      ).toBeVisible();
    }

    if (platform === "ios" && (await button("Open").isVisible())) {
      await button("Open").tap();
    }

    await expect(
      screen.getByText("This reset link has expired. Request a new link.")
    ).toBeVisible();
  }
);
