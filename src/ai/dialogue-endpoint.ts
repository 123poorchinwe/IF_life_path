export function getDialogueEndpoint() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (apiBase) return `${apiBase.replace(/\/$/, "")}/api/dialogue`;
  const external = process.env.NEXT_PUBLIC_DIALOGUE_API_URL?.trim();
  if (external) return external.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT === "true") {
    return "https://game-d7g6sf32s7b58cbcd-1464556999.ap-shanghai.app.tcloudbase.com/if-life-api/api/dialogue";
  }
  return "/api/dialogue";
}

export function withPublicBasePath(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
