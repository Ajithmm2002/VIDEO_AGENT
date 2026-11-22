export function accountLabel(displayName: string | null | undefined, email: string | null | undefined) {
  const name = displayName?.trim();
  if (name) return name;
  const local = email?.split("@")[0]?.trim();
  if (local) return local;
  return "Workspace";
}

export function accountInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return label.trim().slice(0, 2).toUpperCase() || "CS";
}
