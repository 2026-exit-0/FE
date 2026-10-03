export function readWishlist(userId) {
  if (!userId) return [];
  try {
    const value = JSON.parse(localStorage.getItem(`damda_wishlist:${userId}`) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writeWishlist(userId, list) {
  if (userId) localStorage.setItem(`damda_wishlist:${userId}`, JSON.stringify(list));
}
