export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  gmailFrom: process.env.GMAIL_FROM_EMAIL ?? "fleetwizards.app@gmail.com",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD ?? "",
  fleetEmailUser: process.env.FLEET_EMAIL_USER ?? "",
  fleetEmailPassword: process.env.FLEET_EMAIL_PASSWORD ?? "",
};
