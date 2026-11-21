export function usesContentSearch(pathname: string) {
  if (pathname.startsWith("/marketplace")) return false;
  if (pathname.startsWith("/purchases")) return false;
  if (pathname.startsWith("/play")) return false;
  if (pathname.startsWith("/admin")) return false;
  return true;
}

export function headerContext(pathname: string) {
  if (pathname.startsWith("/admin/marketplace")) return "Sell";
  if (pathname.startsWith("/marketplace")) return "Marketplace";
  if (pathname.startsWith("/purchases")) return "Purchases";
  if (pathname.startsWith("/play")) return "Fun mode";
  return "";
}
