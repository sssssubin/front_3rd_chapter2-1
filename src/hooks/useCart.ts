import { useState, useEffect, useCallback } from 'react';
import { Product, CartItem, CartState } from '../types';
import { calculateCart } from '../utils/cartCalculations';
import { saveCartToLocalStorage, loadCartFromLocalStorage } from '../utils/localStorage';
import { INITIAL_PRODUCT_LIST } from '../data/products';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCT_LIST);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItemCount, setTotalItemCount] = useState(0);
  const [currentDiscountRate, setCurrentDiscountRate] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const savedCart = loadCartFromLocalStorage();
    if (savedCart) {
      setCartItems(savedCart.items);
      setTotalAmount(savedCart.totalAmount);
      setTotalItemCount(savedCart.totalItemCount);
      setLoyaltyPoints(savedCart.loyaltyPoints);

      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const cartItem = savedCart.items.find((item) => item.productId === product.id);
          if (cartItem) {
            return { ...product, quantity: product.quantity - cartItem.quantity };
          }
          return product;
        }),
      );
    }
  }, []);

  useEffect(() => {
    const { totalAmount, totalItemCount, currentDiscountRate, loyaltyPoints } = calculateCart(
      cartItems,
      products,
      currentDate,
    );
    setTotalAmount(totalAmount);
    setTotalItemCount(totalItemCount);
    setCurrentDiscountRate(currentDiscountRate);
    setLoyaltyPoints(loyaltyPoints);

    const cartState: CartState = { items: cartItems, totalAmount, totalItemCount, loyaltyPoints };
    saveCartToLocalStorage(cartState);
  }, [cartItems, products, currentDate]);

  const addToCart = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product || product.quantity <= 0) {
        alert('선택한 상품의 재고가 없습니다.');
        return;
      }

      setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.productId === productId);
        if (existingItem) {
          return prevItems.map((item) =>
            item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
          );
        } else {
          return [...prevItems, { productId, quantity: 1 }];
        }
      });

      setProducts((prevProducts) =>
        prevProducts.map((p) => (p.id === productId ? { ...p, quantity: p.quantity - 1 } : p)),
      );
    },
    [products],
  );

  const changeItemQuantity = useCallback((productId: string, change: number) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = Math.max(0, item.quantity + change);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );

    setProducts((prevProducts) =>
      prevProducts.map((p) => (p.id === productId ? { ...p, quantity: p.quantity - change } : p)),
    );
  }, []);

  const removeCartItem = useCallback(
    (productId: string) => {
      const removedItem = cartItems.find((item) => item.productId === productId);
      if (removedItem) {
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.id === productId ? { ...p, quantity: p.quantity + removedItem.quantity } : p)),
        );
        setCartItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
      }
    },
    [cartItems],
  );

  return {
    cartItems,
    products,
    totalAmount,
    totalItemCount,
    currentDiscountRate,
    loyaltyPoints,
    currentDate,
    setCurrentDate,
    addToCart,
    changeItemQuantity,
    removeCartItem,
  };
}
