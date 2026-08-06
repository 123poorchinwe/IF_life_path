export function getDialogueEndpoint() {
  const external = process.env.NEXT_PUBLIC_DIALOGUE_API_URL?.trim();
  if (external) return external.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") return null;
  return "/api/dialogue";
}

export function withPublicBasePath(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
