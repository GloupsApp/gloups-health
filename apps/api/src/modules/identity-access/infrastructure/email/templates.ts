import type { AuthEmail } from "../../application/ports.js";

const messages = {
  en: {
    "reset-password": {
      subject: "Reset your Gloups password",
      text: "Reset your password using this link. It expires in one hour. If you did not request this, you can ignore this email.",
    },
    "verify-email": {
      subject: "Verify your Gloups email address",
      text: "Verify your email address using this link. It expires in one hour.",
    },
  },
  fr: {
    "reset-password": {
      subject: "Réinitialisez votre mot de passe Gloups",
      text: "Réinitialisez votre mot de passe avec ce lien. Il expire dans une heure. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.",
    },
    "verify-email": {
      subject: "Vérifiez votre adresse e-mail Gloups",
      text: "Vérifiez votre adresse e-mail avec ce lien. Il expire dans une heure.",
    },
  },
};

export const renderAuthEmail = (message: AuthEmail) => {
  const content = messages[message.language][message.kind];

  return {
    subject: content.subject,
    text: `${content.text}\n\n${message.url}`,
  };
};
