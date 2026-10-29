import { getLocales } from "expo-localization";
import * as SecureStore from "expo-secure-store";
import { z } from "zod";

const key = "gloups-ui-language-local";
const options = { keychainService: "app.gloups.health.ui.local" };
const languageSchema = z.enum(["en", "fr"]);

export type Language = z.infer<typeof languageSchema>;

let languageInMemory: Language | null = null;

export const preferredLanguage = (): Language => {
  if (languageInMemory) {
    return languageInMemory;
  }

  try {
    const saved = languageSchema.safeParse(SecureStore.getItem(key, options));

    if (saved.success) {
      languageInMemory = saved.data;

      return saved.data;
    }
  } catch {
    /* A non-sensitive UI preference does not grant account access. */
  }

  languageInMemory =
    getLocales().find((locale) =>
      ["en", "fr"].includes(locale.languageCode ?? "")
    )?.languageCode === "fr"
      ? "fr"
      : "en";

  return languageInMemory;
};

export const saveLanguage = (language: Language): void => {
  languageInMemory = language;

  try {
    SecureStore.setItem(key, language, options);
  } catch {
    /* Keep the non-sensitive preference for this process if persistence is unavailable. */
  }
};
