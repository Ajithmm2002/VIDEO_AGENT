export async function downloadListingFile(listingId: string) {
  const response = await fetch(`/api/marketplace/download?id=${listingId}`, { redirect: "manual" });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("Location");
    if (location) {
      window.location.assign(location);
      return;
    }
  }
  if (!response.ok && response.type !== "opaqueredirect") {
    const message = await response.text();
    throw new Error(message || "Could not download.");
  }
  window.location.assign(`/api/marketplace/download?id=${listingId}`);
}
