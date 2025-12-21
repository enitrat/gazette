import crypto from "node:crypto";

const SIGNED_URL_SECRET = process.env.SIGNED_URL_SECRET || "";
export const SIGNED_URL_TTL_SECONDS = parseInt(process.env.SIGNED_URL_TTL_SECONDS || "3600", 10);

if (process.env.NODE_ENV === "production" && !SIGNED_URL_SECRET) {
  throw new Error("SIGNED_URL_SECRET environment variable must be set in production");
}

const getSecret = (): string => {
  if (SIGNED_URL_SECRET) return SIGNED_URL_SECRET;
  return "dev-signed-url-secret";
};

const normalizePath = (path: string) => path.split("?")[0] ?? path;

const signValue = (path: string, exp: number) =>
  crypto.createHmac("sha256", getSecret()).update(`${path}|${exp}`).digest("hex");

export const buildSignedUrl = (path: string, ttlSeconds = SIGNED_URL_TTL_SECONDS) => {
  const normalized = normalizePath(path);
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = signValue(normalized, exp);
  return `${normalized}?exp=${exp}&sig=${sig}`;
};

export const isSignedRequestValid = (
  path: string,
  exp: string | undefined,
  sig: string | undefined
) => {
  if (!exp || !sig) return false;
  const expValue = Number(exp);
  if (!Number.isFinite(expValue)) return false;
  if (expValue < Math.floor(Date.now() / 1000)) return false;

  const normalized = normalizePath(path);
  const expected = signValue(normalized, expValue);

  if (expected.length !== sig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
};

export const signMediaPath = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return buildSignedUrl(path);
};
