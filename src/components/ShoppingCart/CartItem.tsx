import React from 'react';
import { Product } from '../../types';

interface CartItemProps {
  product: Product;
  quantity: number;
  onChangeQuantity: (productId: string, change: number) => void;
  onRemove: (productId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ product, quantity, onChangeQuantity, onRemove }) => {
  return (
    <div className="flex justify-between items-center mb-2">
      <span>
        {product.name} - {product.price}원 x {quantity}
      </span>
      <div>
        <button
          onClick={() => onChangeQuantity(product.id, -1)}
          className="bg-blue-500 text-white px-2 py-1 rounded mr-1"
        >
          -
        </button>
        <button
          onClick={() => onChangeQuantity(product.id, 1)}
          className="bg-blue-500 text-white px-2 py-1 rounded mr-1"
        >
          +
        </button>
        <button onClick={() => onRemove(product.id)} className="bg-red-500 text-white px-2 py-1 rounded">
          삭제
        </button>
      </div>
    </div>
  );
};

export default CartItem;
