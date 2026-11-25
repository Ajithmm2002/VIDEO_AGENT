export function usesContentSearch(pathname: string) {
  if (pathname.startsWith("/marketplace")) return false;
  if (pathname.startsWith("/purchases")) return false;
  if (pathname.startsWith("/play")) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/profile")) return false;
  if (pathname.startsWith("/deals")) return false;
  if (pathname.startsWith("/creator-page")) return false;
  return true;
}

export function headerContext(pathname: string) {
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/deals")) return "Brand deals";
  if (pathname.startsWith("/creator-page")) return "Creator page";
  if (pathname.startsWith("/admin/marketplace/new")) return "List a product";
  if (pathname.startsWith("/admin/marketplace")) return "Manage products";
  if (pathname.startsWith("/marketplace")) return "Marketplace";
  if (pathname.startsWith("/purchases")) return "Purchases";
  if (pathname.startsWith("/play")) return "Fun mode";
  return "";
}
