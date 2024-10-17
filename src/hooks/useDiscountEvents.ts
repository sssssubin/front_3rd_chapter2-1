import { useState, useEffect } from 'react';
import { Product } from '../types';
import { LIGHTNING_SALE_PROBABILITY, LIGHTNING_SALE_DISCOUNT, DOUBLE_DISCOUNT_RATE } from '../constants';

export function useDiscountEvents(initialProducts: Product[], selectedProductId: string | null) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    const lightningInterval = setInterval(() => {
      const luckyItem = products[Math.floor(Math.random() * products.length)];
      if (Math.random() < LIGHTNING_SALE_PROBABILITY && luckyItem.quantity > 0) {
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p.id === luckyItem.id ? { ...p, price: Math.round(p.price * LIGHTNING_SALE_DISCOUNT) } : p,
          ),
        );
        alert(`번개세일! ${luckyItem.name}이(가) 20% 할인 중입니다!`);
      }
    }, 30000);

    const suggestInterval = setInterval(() => {
      if (selectedProductId) {
        const suggest = products.find((p) => p.id !== selectedProductId && p.quantity > 0);
        if (suggest) {
          setProducts((prevProducts) =>
            prevProducts.map((p) =>
              p.id === suggest.id ? { ...p, price: Math.round(p.price * DOUBLE_DISCOUNT_RATE) } : p,
            ),
          );
          alert(`${suggest.name}은(는) 어떠세요? 지금 구매하시면 5% 추가 할인!`);
        }
      }
    }, 60000);

    return () => {
      clearInterval(lightningInterval);
      clearInterval(suggestInterval);
    };
  }, [products, selectedProductId]);

  return products;
}
