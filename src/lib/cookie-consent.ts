export const COOKIE_CONSENT_KEY = "febis_cookie_consent";
export const COOKIE_CONSENT_EVENT = "febis:cookie-consent";
export const COOKIE_CONSENT_OPEN_EVENT = "febis:cookie-preferences";

export type CookieCategoryId = "necessary" | "preferences" | "analytics" | "marketing";

export type CookiePreferences = {
  necessary: true;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type CookieConsentState = {
  version: 1;
  decidedAt: string;
  preferences: CookiePreferences;
};

export type CookieCategory = {
  id: CookieCategoryId;
  title: string;
  description: string;
  required?: boolean;
  examples: string[];
};

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: "necessary",
    title: "Nécessaires",
    description:
      "Indispensables au fonctionnement du site : session sécurisée, navigation et mémorisation de vos choix cookies.",
    required: true,
    examples: ["Session administrateur", "Choix de consentement"],
  },
  {
    id: "preferences",
    title: "Préférences",
    description:
      "Mémorisent vos réglages d’affichage et de parcours pour personnaliser votre expérience.",
    examples: ["Langue / affichage", "Derniers filtres consultés"],
  },
  {
    id: "analytics",
    title: "Mesure d’audience",
    description:
      "Nous aident à comprendre l’usage du site (pages vues, parcours) afin d’améliorer les services FEBiS.",
    examples: ["Statistiques anonymisées", "Performance des pages"],
  },
  {
    id: "marketing",
    title: "Marketing",
    description:
      "Permettent de mesurer les campagnes et d’afficher des contenus plus pertinents. Désactivés par défaut.",
    examples: ["Suivi de campagne", "Contenus personnalisés"],
  },
];

export const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
};

export function acceptAllPreferences(): CookiePreferences {
  return {
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: true,
  };
}

export function rejectOptionalPreferences(): CookiePreferences {
  return { ...DEFAULT_PREFERENCES };
}

export function readConsent(): CookieConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentState;
    if (parsed?.version !== 1 || !parsed.preferences) return null;
    return {
      version: 1,
      decidedAt: parsed.decidedAt,
      preferences: {
        necessary: true,
        preferences: Boolean(parsed.preferences.preferences),
        analytics: Boolean(parsed.preferences.analytics),
        marketing: Boolean(parsed.preferences.marketing),
      },
    };
  } catch {
    return null;
  }
}

export function writeConsent(preferences: CookiePreferences): CookieConsentState {
  const state: CookieConsentState = {
    version: 1,
    decidedAt: new Date().toISOString(),
    preferences: {
      necessary: true,
      preferences: preferences.preferences,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    },
  };

  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(state));

  // Miroir court pour les outils serveur / CDN (non sensible).
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_CONSENT_KEY}=1; path=/; max-age=${maxAge}; SameSite=Lax`;

  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: state }),
  );

  return state;
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}

export function hasConsentFor(
  category: Exclude<CookieCategoryId, "necessary">,
  state: CookieConsentState | null = readConsent(),
): boolean {
  if (!state) return false;
  return Boolean(state.preferences[category]);
}
