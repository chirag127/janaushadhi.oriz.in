---
// src/components/CartWidget.tsx
// Mini cart dropdown widget (React island)

import { useState, useEffect } from 'react';
import { getCart, removeFromCart, getCartTotal } from '../lib/cart';

interface CartItem {
  slug: string;
  quantity: number;
}

export default function CartWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const loadCart = () => {
      setCart(getCart());
    };

    loadCart();
    window.addEventListener('cart-updated', loadCart);

    return () => window.removeEventListener('cart-updated', loadCart);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemove = (slug: string) => {
    removeFromCart(slug);
    setCart(getCart());
    window.dispatchEvent(new Event('cart-updated'));
  };

  return (
    <div className="cart-widget" style={{ position: 'relative' }}>
      <button
        className="cart-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open cart"
        aria-expanded={isOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        {totalItems > 0 && (
          <span className="cart-badge">{totalItems}</span>
        )}
      </button>

      {isOpen && (
        <div className="cart-dropdown">
          <div className="cart-header">
            <h3>Shopping Cart ({totalItems} items)</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Close cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke="width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {cart.length > 0 ? (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div className="cart-item" key={item.slug}>
                    <div className="item-details">
                      <span className="item-slug">{item.slug.replace(/-/g, ' ')}</span>
                      <span className="item-qty">Qty: {item.quantity}</span>
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemove(item.slug)}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="cart-footer">
                <a href="/cart" class="btn btn-secondary">View Cart</a>
                <a href="/checkout" class="btn btn-primary">Checkout</a>
              </div>
            </>
          ) : (
            <div className="cart-empty">
              <p>Your cart is empty</p>
              <a href="/medicines" onClick={() => setIsOpen(false)}>Browse medicines</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
