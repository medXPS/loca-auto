type ErrorLike = {
  code?: unknown;
  message?: unknown;
  cause?: unknown;
};

const TRANSIENT_DATABASE_ERROR_CODES = new Set([
  "57P01", // admin_shutdown
  "57P02", // crash_shutdown
  "57P03", // cannot_connect_now / recovery mode
]);

const TRANSIENT_DATABASE_MESSAGES = [
  "database system is in recovery mode",
  "database system is starting up",
  "terminating connection due to administrator command",
  "the database system is in recovery mode",
  "the database system is starting up",
];

function collectErrorChain(error: unknown): ErrorLike[] {
  const chain: ErrorLike[] = [];
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current; depth += 1) {
    if (typeof current !== "object") break;
    chain.push(current as ErrorLike);
    current = (current as ErrorLike).cause;
  }

  return chain;
}

export function isDatabaseUnavailableError(error: unknown) {
  return collectErrorChain(error).some((candidate) => {
    const code =
      typeof candidate.code === "string" ? candidate.code.trim() : "";
    if (TRANSIENT_DATABASE_ERROR_CODES.has(code)) return true;

    const message =
      typeof candidate.message === "string"
        ? candidate.message.toLowerCase()
        : "";

    return TRANSIENT_DATABASE_MESSAGES.some((pattern) =>
      message.includes(pattern),
    );
  });
}
