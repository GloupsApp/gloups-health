/* oxlint-disable no-await-in-loop -- Expo setup screens settle before selecting the next action. */
import { beforeEach, test } from "@e2e-dev/mobile";
import { expect } from "e2e";

const nativeBuild = process.env["GLOUPS_AUTH003_NATIVE"] === "1";

beforeEach(async ({ app, device, screen }) => {
  if (process.env["GLOUPS_AUTH003_FOLD"] === "1") {
    await device.fold("open");
  }

  await app.open();

  if (!nativeBuild) {
    await device.openLink("exp://127.0.0.1:8085");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const email = screen.getByTestId("sign-in-email");
    const open = screen.getByRole("button", { exact: true, name: "Open" });
    const intro = screen.getByText("Continue", { exact: true });
    await expect
      .poll(
        async () =>
          (await email.count()) + (await open.count()) + (await intro.count()),
        { timeout: 30_000 }
      )
      .toBeGreaterThan(0);

    if (await email.count()) {
      break;
    }

    if (await open.count()) {
      await device.alert("accept");
    } else if (await intro.count()) {
      await intro.tap();
    }
  }
});

test(
  "MOBILE-01: the Expo authentication screen uses native controls and explicit language choice",
  { platforms: ["ios", "android"], timeout: 120_000 },
  async ({ screen, app, device }) => {
    await expect(screen.getByTestId("sign-in-email")).toBeVisible({
      timeout: 30_000,
    });
    await expect(screen.getByTestId("sign-in-password")).toBeVisible();
    await expect(screen.getByTestId("sign-in-submit")).toBeVisible();

    if (
      await screen
        .getByRole("button", { exact: true, name: "Se connecter" })
        .count()
    ) {
      await screen.scrollUntilVisible(screen.getByTestId("language-en"));
      await screen.getByTestId("language-en").tap();
    }

    await screen.scrollUntilVisible(screen.getByTestId("language-fr"));
    await screen.getByTestId("language-fr").tap();
    await expect(
      screen.getByRole("button", { exact: true, name: "Se connecter" })
    ).toBeVisible();
    await screen.getByTestId("language-en").tap();
    await app.screenshot("sign-in-en");
    await device.setAppearance("dark");
    await app.screenshot("sign-in-dark");
    await device.setAppearance("light");
  }
);
