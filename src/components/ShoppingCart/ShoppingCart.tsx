import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import { useDiscountEvents } from '../../hooks/useDiscountEvents';
import CartItem from './CartItem';
import ProductSelector from './ProductSelector';
import { STOCK_WARNING_THRESHOLD } from '../../constants';
import { dateUtils } from '../../utils/dateUtils';

const ShoppingCart: React.FC = () => {
  const {
    cartItems,
    products,
    totalAmount,
    totalItemCount,
    currentDiscountRate,
    loyaltyPoints,
    addToCart,
    changeItemQuantity,
    removeCartItem,
  } = useCart();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  const discountedProducts = useDiscountEvents(products, selectedProductId);

  return (
    <div className="bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <h1 className="text-2xl font-bold mb-4">장바구니</h1>
        <div id="cart-items">
          {cartItems.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return null;
            return (
              <CartItem
                key={item.productId}
                product={product}
                quantity={item.quantity}
                onChangeQuantity={changeItemQuantity}
                onRemove={removeCartItem}
              />
            );
          })}
        </div>
        <div id="cart-total" className="text-xl font-bold my-4">
          총액: {Math.round(totalAmount)}원
          {totalItemCount >= 10 && (
            <span className="text-green-500 ml-2">({(currentDiscountRate * 100).toFixed(1)}% 할인 적용)</span>
          )}
          <span id="loyalty-points" className="text-blue-500 ml-2">
            (포인트: {loyaltyPoints})
          </span>
        </div>
        <ProductSelector
          products={discountedProducts}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
        />
        <button onClick={() => addToCart(selectedProductId)} className="bg-blue-500 text-white px-4 py-2 rounded">
          추가
        </button>
        <div id="stock-status" className="text-sm text-gray-500 mt-2">
          {products
            .filter((product) => product.quantity < STOCK_WARNING_THRESHOLD)
            .map((product) => (
              <div key={product.id}>
                {product.name}: {product.quantity > 0 ? `재고 부족 (${product.quantity}개 남음)` : '품절'}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
