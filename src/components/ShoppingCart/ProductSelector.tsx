import React from 'react';
import { Product } from '../../types';

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, selectedProductId, onSelectProduct }) => {
  return (
    <select
      className="border rounded p-2 mr-2"
      value={selectedProductId}
      onChange={(e) => onSelectProduct(e.target.value)}
    >
      {products.map((product) => (
        <option key={product.id} value={product.id} disabled={product.quantity === 0}>
          {product.name} - {product.price}원
        </option>
      ))}
    </select>
  );
};

export default ProductSelector;
