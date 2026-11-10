/** Central product identity — rename the product here only. */
export const APP = {
  name: "Little Star Adventure",
  shortName: "Little Star",
  subtitle: "Build good habits. Complete your missions. Become your best self.",
  themeColor: "#7c5cff",
} as const;

export const SESSION = {
  cookieName: "lsa_session",
  familyCookieName: "lsa_family",
  parentMaxAgeDays: 14,
  childMaxAgeDays: 60,
} as const;

export const SECURITY = {
  maxFailedLogins: 5,
  lockMinutes: 5,
  resetTokenMinutes: 30,
} as const;
