export const readCookieValue = (cookieName, cookieSource = null) => {
  const resolvedCookieSource =
    cookieSource !== null
      ? cookieSource
      : typeof document === "undefined"
        ? ""
        : document.cookie;

  return String(resolvedCookieSource || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((resolvedValue, part) => {
      if (resolvedValue) {
        return resolvedValue;
      }

      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return "";
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      return key === cookieName ? decodeURIComponent(value) : "";
    }, "");
};
