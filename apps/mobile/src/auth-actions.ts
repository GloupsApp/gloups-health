import {
  authErrorSchema,
  passwordPolicy,
  passwordSchema,
  registrationSchema,
} from "@gloups/contracts";

import { authClient } from "./auth-client";

export type AuthMode = "sign-in" | "sign-up" | "verify" | "recover" | "reset";

interface AuthInput {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
  resetToken: string | null;
}

const errorMessage = (error: {
  code?: string | undefined;
  message?: string | undefined;
}) => {
  const result = authErrorSchema.safeParse(error);

  if (!result.success) {
    return "We could not reach Gloups. Please try again.";
  }

  switch (result.data.code) {
    case "INVALID_EMAIL_OR_PASSWORD": {
      return "The email or password is incorrect.";
    }

    case "EMAIL_NOT_VERIFIED": {
      return "Verify your email before signing in.";
    }

    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL": {
      return "An account may already use this email. Try signing in or resetting your password.";
    }

    case "TOO_MANY_REQUESTS": {
      return "Please wait a moment before trying again.";
    }

    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED": {
      return "This link is invalid or has expired. Request a new one.";
    }

    default: {
      return "We could not complete that request. Please try again.";
    }
  }
};

const result = (
  mode: AuthMode,
  message = "",
  signedIn = false,
  clearPassword = true
) => ({ clearPassword, message, mode, signedIn });

export const performAuthAction = async (input: AuthInput) => {
  const { mode, password, name, resetToken } = input;
  const email = input.email.trim();

  try {
    if (mode === "sign-up") {
      const parsed = registrationSchema.safeParse({ email, name, password });

      if (!parsed.success) {
        return result(
          mode,
          `Enter a valid email and a password of ${passwordPolicy.minimumLength} to ${passwordPolicy.maximumLength} characters. Your name can be up to 100 characters.`,
          false,
          false
        );
      }

      const response = await authClient.signUp.email({
        ...parsed.data,
        callbackURL: "gloups-health://verified",
      });

      return response.error
        ? result(mode, errorMessage(response.error))
        : result("verify");
    }

    if (mode === "sign-in") {
      const response = await authClient.signIn.email({ email, password });

      if (response.error) {
        return result(
          response.error.code === "EMAIL_NOT_VERIFIED" ? "verify" : mode,
          errorMessage(response.error)
        );
      }

      return result(mode, "", true);
    }

    if (mode === "verify") {
      const response = await authClient.sendVerificationEmail({
        callbackURL: "gloups-health://verified",
        email,
      });

      return result(
        mode,
        response.error
          ? errorMessage(response.error)
          : "If verification is needed, a new link is on its way."
      );
    }

    if (mode === "recover") {
      const response = await authClient.requestPasswordReset({
        email,
        redirectTo: "gloups-health://reset-password",
      });

      return result(
        mode,
        response.error
          ? errorMessage(response.error)
          : "If this email has an account, a reset link is on its way."
      );
    }

    if (!resetToken || !passwordSchema.safeParse(password).success) {
      return result(
        mode,
        `Use a valid reset link and a password of ${passwordPolicy.minimumLength} to ${passwordPolicy.maximumLength} characters.`,
        false,
        false
      );
    }

    const response = await authClient.resetPassword({
      newPassword: password,
      token: resetToken,
    });

    return response.error
      ? result(mode, errorMessage(response.error))
      : result(
          "sign-in",
          "Your password was reset. Sign in with your new password."
        );
  } catch {
    return result(
      mode,
      "We could not reach Gloups. Please try again.",
      false,
      false
    );
  }
};
