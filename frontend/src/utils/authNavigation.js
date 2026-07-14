export const buildAuthRedirectLink = (basePath, currentPath = "/", currentSearch = "") => {
  if (currentPath === "/login" || currentPath === "/register") {
    return basePath;
  }

  const resolvedPath = `${currentPath || "/"}${currentSearch || ""}`;

  if (!resolvedPath || resolvedPath === "/") {
    return basePath;
  }

  return `${basePath}?next=${encodeURIComponent(resolvedPath)}`;
};

export const resolveNextPath = (nextPath) => (typeof nextPath === "string" && nextPath.startsWith("/") ? nextPath : "/");
