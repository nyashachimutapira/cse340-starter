const { Pool } = require("pg");

/**
 * Create a shared PostgreSQL connection pool that can be reused
 * throughout the application (e.g., for session storage).
 * Connection details are read from environment variables.
 */
const connectionOptions = {};

const appendSslMode = (url) => {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }
    return parsed.toString();
  } catch {
    return url.includes("sslmode=") ? url : `${url}?sslmode=require`;
  }
};

if (process.env.DATABASE_URL) {
  connectionOptions.connectionString = appendSslMode(
    process.env.DATABASE_URL
  );
} else {
  connectionOptions.host = process.env.DB_HOST;
  connectionOptions.port = process.env.DB_PORT;
  connectionOptions.database = process.env.DB_NAME;
  connectionOptions.user = process.env.DB_USER;
  connectionOptions.password = process.env.DB_PASSWORD;
}

/**
 * Render-hosted PostgreSQL instances (and most other managed providers)
 * require SSL/TLS even for basic connections. Historically this only
 * happened when NODE_ENV was "production", which breaks local development
 * against those managed databases. We now enable SSL by default whenever a
 * DATABASE_URL is provided, unless explicitly disabled. Developers can
 * still force/disable SSL via DB_SSL env var.
 */
const shouldUseSSL = (() => {
  if (process.env.DB_SSL === "true") return true;
  if (process.env.DB_SSL === "false") return false;
  if (process.env.DATABASE_URL) return true;
  if (process.env.NODE_ENV === "production") return true;
  return false;
})();

if (shouldUseSSL) {
  const rejectUnauthorized =
    process.env.DB_SSL_REJECT_UNAUTHORIZED === "true" ? true : false;
  connectionOptions.ssl = { rejectUnauthorized };
}

const pool = new Pool(connectionOptions);

module.exports = pool;

