import { CartState } from '../types';

export function saveCartToLocalStorage(cartState: CartState) {
  localStorage.setItem('cartState', JSON.stringify(cartState));
}

export function loadCartFromLocalStorage(): CartState | null {
  const savedCart = localStorage.getItem('cartState');
  return savedCart ? JSON.parse(savedCart) : null;
}
