import type { en } from "./strings.en";

export const fr = {
  account: "Votre compte",
  accountDeleted: "Vos données Gloups ont été supprimées.",
  accountDeletionPending:
    "Votre compte est fermé. La suppression Gloups est en cours.",
  apple: "Continuer avec Apple",
  appleEmailRequired:
    "Connectez-vous avec une méthode existante, puis associez Apple depuis votre compte.",
  appleManual:
    "Retirez Gloups de Connexion avec Apple dans les réglages de votre compte Apple.",
  applePending: "La révocation de l’accès Apple est encore en cours.",
  appleUnconfirmed:
    "La connexion Apple n’a pas pu être confirmée. Reconnectez-vous pour vérifier vos méthodes, ou retirez Gloups de Connexion avec Apple dans les réglages de votre compte Apple.",
  backToSignIn: "Revenir à la connexion",
  cancel: "Annuler",
  cancelled: "La connexion a été annulée. Vous pouvez réessayer.",
  changePassword: "Modifier le mot de passe",
  checkEmail: "Consultez vos e-mails",
  checkEmailBody:
    "Ouvrez le lien de vérification, puis revenez ici pour vous connecter.",
  confirmDelete: "Supprimer mon compte",
  createAccount: "Créer un compte",
  currentPassword: "Mot de passe actuel",
  deleteAccount: "Supprimer le compte",
  deleteBody:
    "Votre compte sera fermé et vos données Gloups supprimées. La révocation de l’accès Apple peut prendre plus de temps.",
  deleteConfirmation: "Supprimer votre compte ?",
  deleteInterrupted:
    "La suppression n’a pas pu être confirmée. L’accès local est effacé. Reconnectez-vous pour vérifier votre compte ; la suppression peut encore être en cours.",
  displayName: "Prénom (facultatif)",
  email: "E-mail",
  emailUnverified: "Vérifiez votre e-mail avant de vous connecter.",
  english: "English",
  forgotPassword: "Mot de passe oublié ?",
  french: "Français",
  freshAuthRequired: "Reconnectez-vous avant de modifier votre compte.",
  google: "Continuer avec Google",
  healthCoach: "Votre coach santé",
  hidePassword: "Masquer le mot de passe",
  identityConflict:
    "Cette méthode ne peut pas être associée. Utilisez votre méthode habituelle, puis vérifiez votre compte.",
  invalidCredentials: "L’e-mail ou le mot de passe est incorrect.",
  invalidInput: "Vérifiez les informations saisies, puis réessayez.",
  invalidLink:
    "Ce lien est invalide, expiré ou déjà utilisé. Demandez-en un nouveau.",
  language: "Langue",
  lastMethod: "Conservez au moins une méthode de connexion sur votre compte.",
  linkApple: "Associer Apple",
  linkGoogle: "Associer Google",
  loading: "Vérification de votre session…",
  methods: "Méthodes de connexion",
  newPassword: "Nouveau mot de passe",
  offline:
    "Vous êtes hors connexion. Connectez-vous à Internet pour vérifier votre session.",
  password: "Mot de passe",
  passwordHint:
    "Utilisez 15 à 128 caractères. Vous pouvez coller votre mot de passe depuis votre gestionnaire.",
  passwordUpdated:
    "Mot de passe modifié. Connectez-vous avec le nouveau mot de passe.",
  rateLimited: "Trop de tentatives. Patientez avant de réessayer.",
  recoveryBody:
    "Si un compte utilise cet e-mail, un lien de réinitialisation va être envoyé.",
  remoteUnconfirmed:
    "Vous êtes déconnecté sur cet appareil. La déconnexion à distance n’a pas pu être confirmée.",
  resend: "Renvoyer l’e-mail de vérification",
  resetPassword: "Réinitialiser le mot de passe",
  retry: "Réessayer",
  save: "Enregistrer",
  sendReset: "Envoyer le lien",
  sent: "E-mail demandé. Consultez votre boîte de réception.",
  setPassword: "Ajouter un mot de passe",
  showPassword: "Afficher le mot de passe",
  signIn: "Se connecter",
  signOut: "Se déconnecter",
  socialInterrupted:
    "La connexion a été interrompue. Recommencez pour continuer en toute sécurité.",
  success: "Enregistré",
  unavailable:
    "Votre session n’a pas pu être vérifiée. Réessayez dans un instant.",
  unlink: "Retirer",
  verificationReturned:
    "Connectez-vous pour confirmer la vérification de votre e-mail.",
  verified: "E-mail vérifié. Vous pouvez vous connecter.",
  verifyEmail: "Vérifier l’e-mail",
} satisfies Record<keyof typeof en, string>;
