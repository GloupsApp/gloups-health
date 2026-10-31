import {
  authErrorSchema,
  passwordPolicy,
  passwordSchema,
  registrationSchema,
} from "@gloups/contracts";

import { authClient, completeProviderAuth } from "./auth-client";
import type { SocialProvider } from "./auth-client";

export type AuthMode = "sign-in" | "sign-up" | "verify" | "recover" | "reset";

interface AuthInput {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
  resetToken: string | null;
}

export const errorMessage = (error: {
  code?: string | undefined;
  message?: string | undefined;
}) => {
  const result = authErrorSchema.safeParse({ message: "", ...error });

  if (!result.success) {
    return "We could not reach Gloups. Please try again.";
  }

  switch (result.data.code) {
    case "PROVIDER_CANCELLED":
    case "ACCESS_DENIED": {
      return "Sign-in was cancelled. Try again or use another linked method.";
    }

    case "ACCOUNT_NOT_LINKED": {
      return "Sign in with your existing method, then link this provider from your account.";
    }

    case "SOCIAL_ACCOUNT_ALREADY_LINKED":
    case "ACCOUNT_ALREADY_LINKED_TO_DIFFERENT_USER": {
      return "This provider belongs to another Gloups account. Use a different provider account.";
    }

    case "FAILED_TO_UNLINK_LAST_ACCOUNT": {
      return "Add another available sign-in method before removing this one.";
    }

    case "FRESH_SESSION_REQUIRED":
    case "LINK_SESSION_EXPIRED":
    case "SESSION_NOT_FRESH": {
      return "Sign out and sign in again before changing your sign-in methods.";
    }

    case "PROVIDER_ACCESS_REVOKED": {
      return "Recover access with Apple or Google, or sign in with another linked method.";
    }

    case "PROVIDER_NOT_FOUND": {
      return "This provider is unavailable. Use another method or try again later.";
    }

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
          : "If this email has a password, a reset link is on its way."
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

export const performSocialAction = async (
  provider: SocialProvider,
  linking = false
) => {
  try {
    const outcome = await completeProviderAuth(provider, linking);

    return {
      completed: outcome.completed,
      message: outcome.error ? errorMessage(outcome.error) : "",
    };
  } catch {
    return {
      completed: false,
      message:
        "We could not reach the provider. Try again or use another linked method.",
    };
  }
};
