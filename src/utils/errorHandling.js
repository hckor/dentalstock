export function getErrorDetail(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (!error) return "unknown error";

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function shouldLogHandledError() {
  return typeof console !== "undefined" && import.meta.env?.MODE !== "test";
}

export function handleAppError(error, { context = "app", userMessage, showToast } = {}) {
  if (shouldLogHandledError()) {
    console.error(`[DentalStock] ${context}: ${getErrorDetail(error)}`, error);
  }

  if (userMessage && typeof showToast === "function") {
    showToast(userMessage);
  }

  return { context, detail: getErrorDetail(error), userMessage: userMessage || "" };
}
