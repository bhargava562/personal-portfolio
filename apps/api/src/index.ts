import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { csrf } from "hono/csrf";

export type ApiBindings = CloudflareBindings & {
  SYNC_SECRET?: string;
  PORTFOLIO_DOMAIN?: string;
};

const ALLOWED_ORIGINS = [
  "http://localhost:4321",
  "https://bhargava.dev",
  "https://portfolio.workers.dev",
  "https://portfolio-web.pages.dev",
];

function isOriginAllowed(
  origin: string,
  allowedOrigins: string[],
  configuredDomain?: string
): boolean {
  if (allowedOrigins.includes(origin)) return true;
  if (!configuredDomain) return false;
  try {
    const url = new URL(origin);
    const host = configuredDomain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return url.hostname === host || url.hostname.endsWith(`.${host}`);
  } catch {
    return false;
  }
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const aHash = await crypto.subtle.digest("SHA-256", enc.encode(a));
  const bHash = await crypto.subtle.digest("SHA-256", enc.encode(b));
  const aView = new Uint8Array(aHash);
  const bView = new Uint8Array(bHash);
  let diff = 0;
  for (let i = 0; i < aView.length; i++) {
    diff |= aView[i]! ^ bView[i]!;
  }
  return diff === 0;
}

const app = new Hono<{ Bindings: ApiBindings }>();

// 1. Global Secure Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
app.use(
  "*",
  secureHeaders({
    xContentTypeOptions: "nosniff",
    xFrameOptions: "DENY",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
    },
  })
);

// 2. Global CORS with robust origin validation
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      if (!origin) return undefined;
      return isOriginAllowed(origin, ALLOWED_ORIGINS, c.env.PORTFOLIO_DOMAIN)
        ? origin
        : undefined;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Sync-Secret"],
  })
);

// 3. Global CSRF protection with strict origin checking (exempting server-to-server webhook sync)
app.use(
  "*",
  csrf({
    origin: (origin, c) => {
      // Server-to-server webhook path is authenticated via secret token
      if (c.req.path === "/sync") {
        return true;
      }
      if (!origin) return true;
      const requestOrigin = new URL(c.req.url).origin;
      return (
        origin === requestOrigin ||
        isOriginAllowed(origin, ALLOWED_ORIGINS, c.env.PORTFOLIO_DOMAIN)
      );
    },
  })
);

app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "portfolio-api",
    message: "Hello World from Hono on Cloudflare Workers!",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
  });
});

app.post("/sync", async (c) => {
  // Protect POST /sync with constant-time SYNC_SECRET comparison
  const authHeader = c.req.header("authorization");
  const syncSecretHeader = c.req.header("x-sync-secret");
  let providedToken: string | undefined;

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    providedToken = authHeader.slice(7).trim();
  } else if (syncSecretHeader) {
    providedToken = syncSecretHeader.trim();
  }

  const expectedSecret = c.env.SYNC_SECRET;
  const isAuthorized =
    Boolean(expectedSecret) &&
    Boolean(providedToken) &&
    (await timingSafeEqual(providedToken!, expectedSecret!));

  if (!isAuthorized) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Invalid or missing sync authentication secret",
      },
      401
    );
  }

  return c.json(
    {
      message: "Supabase to Cloudflare KV sync not implemented yet",
    },
    501
  );
});

export default app;
