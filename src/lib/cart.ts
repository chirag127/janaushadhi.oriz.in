/**
 * Shopping Cart Utilities
 * Handles cart state in localStorage for guests and Firestore for logged-in users
 */

// SSR-safe localStorage access
function isLocalStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

const CART_STORAGE_KEY = 'janaushadhi-cart';
const WISHLIST_STORAGE_KEY = 'janaushadhi-wishlist';
const RECENTLY_VIEWED_KEY = 'janaushadhi-recently-viewed';
const MAX_RECENT_ITEMS = 10;

export interface CartItem {
  slug: string;
  drugCode: string;
  genericName: string;
  unitSize: string;
  mrp: number;
  quantity: number;
  addedAt: number;
}

export interface WishlistItem {
  slug: string;
  addedAt: number;
}

/**
 * Get cart from localStorage
 */
export function getCart(): CartItem[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
}

/**
 * Save cart to localStorage
 */
export function saveCart(cart: CartItem[]): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Add item to cart
 */
export function addToCart(slug: string, quantity: number = 1): CartItem[] {
  const cart = getCart();
  const existingItem = cart.find(item => item.slug === slug);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      slug,
      quantity,
      drugCode: '',
      genericName: '',
      unitSize: '',
      mrp: 0,
      addedAt: Date.now()
    });
  }

  saveCart(cart);
  updateCartBadge();
  return cart;
}

/**
 * Remove item from cart
 */
export function removeFromCart(slug: string): CartItem[] {
  const cart = getCart().filter(item => item.slug !== slug);
  saveCart(cart);
  updateCartBadge();
  return cart;
}

/**
 * Update item quantity
 */
export function updateQuantity(slug: string, quantity: number): CartItem[] {
  const cart = getCart();
  const item = cart.find(item => item.slug === slug);

  if (item) {
    if (quantity <= 0) {
      return removeFromCart(slug);
    }
    item.quantity = quantity;
    saveCart(cart);
  }

  updateCartBadge();
  return cart;
}

/**
 * Clear cart
 */
export function clearCart(): void {
  saveCart([]);
  updateCartBadge();
}

/**
 * Get cart total items count
 */
export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get cart total price (requires medicine data lookup)
 */
export function getCartTotal(): number {
  return 0; // Will be calculated with medicine data
}

/**
 * Update cart badge in header
 */
export function updateCartBadge(): void {
  if (!isLocalStorageAvailable()) return;

  const badge = document.getElementById('cart-count');
  if (badge) {
    const count = getCartCount();
    badge.textContent = count.toString();
    badge.classList.toggle('visible', count > 0);
  }
}

/**
 * Wishlist operations
 */
export function getWishlist(): WishlistItem[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const wishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
  } catch {
    return [];
  }
}

export function saveWishlist(wishlist: WishlistItem[]): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  } catch {
    // Ignore errors
  }
}

export function addToWishlist(slug: string): boolean {
  const wishlist = getWishlist();
  if (!wishlist.some(item => item.slug === slug)) {
    wishlist.push({ slug, addedAt: Date.now() });
    saveWishlist(wishlist);
    return true;
  }
  return false;
}

export function removeFromWishlist(slug: string): boolean {
  const wishlist = getWishlist().filter(item => item.slug !== slug);
  saveWishlist(wishlist);
  return true;
}

export function isInWishlist(slug: string): boolean {
  return getWishlist().some(item => item.slug === slug);
}

/**
 * Recently viewed medicines
 */
export function getRecentlyViewed(): string[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const recent = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
}

export function addToRecentlyViewed(slug: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    let recent = getRecentlyViewed();
    recent = recent.filter(item => item !== slug);
    recent.unshift(slug);

    if (recent.length > MAX_RECENT_ITEMS) {
      recent = recent.slice(0, MAX_RECENT_ITEMS);
    }

    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recent));
  } catch {
    // Ignore errors
  }
}

/**
 * Initialize cart badge on page load (client-side only)
 */
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', updateCartBadge);
}
