export function usesContentSearch(pathname: string) {
  if (pathname.startsWith("/marketplace")) return false;
  if (pathname.startsWith("/play")) return false;
  if (pathname.startsWith("/admin")) return false;
  return true;
}

export function headerContext(pathname: string) {
  if (pathname.startsWith("/admin/marketplace")) return "Shop desk";
  if (pathname.startsWith("/marketplace")) return "Skill shop";
  if (pathname.startsWith("/play")) return "Fun mode";
  return "";
}
