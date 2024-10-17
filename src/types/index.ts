// 타입 정의
export interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalItemCount: number;
  loyaltyPoints: number;
}
