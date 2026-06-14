/** Best-effort extraction of a human-readable message from an RTK Query /
 *  fetch error shape, falling back to a generic message. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong."): string {
  if (!error) return fallback;

  if (error instanceof Error) return error.message || fallback;

  if (typeof error === "object") {
    const err = error as {
      data?: { payload?: { message?: string }; message?: string; error?: string };
      error?: string;
      message?: string;
      status?: number | string;
    };

    const msg =
      err.data?.payload?.message ??
      err.data?.message ??
      err.data?.error ??
      err.message ??
      err.error;

    if (typeof msg === "string" && msg.trim()) return msg;

    if (err.status != null) return `Request failed (${err.status}).`;
  }

  return fallback;
}
