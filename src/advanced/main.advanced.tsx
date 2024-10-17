import React, { useState, useEffect, useCallback } from 'react';

// 타입 정의
interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartItem {
  productId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalItemCount: number;
  loyaltyPoints: number;
}

// 상수 정의
const DISCOUNT_RATES: { [key: string]: number } = {
  p1: 0.1,
  p2: 0.15,
  p3: 0.2,
  p4: 0.05,
  p5: 0.25,
};

const BULK_DISCOUNT_THRESHOLD = 30;
const BULK_DISCOUNT_RATE = 0.25;
const TUESDAY_DISCOUNT_RATE = 0.1;
const DOUBLE_DISCOUNT_RATE = 0.95;
const POINT_RATE = 1000;
const STOCK_WARNING_THRESHOLD = 5;
const LIGHTNING_SALE_PROBABILITY = 0.3;
const LIGHTNING_SALE_DISCOUNT = 0.8;

// 상품 목록
const INITIAL_PRODUCT_LIST: Product[] = [
  { id: 'p1', name: '상품1', price: 10000, quantity: 50 },
  { id: 'p2', name: '상품2', price: 20000, quantity: 30 },
  { id: 'p3', name: '상품3', price: 30000, quantity: 20 },
  { id: 'p4', name: '상품4', price: 15000, quantity: 0 },
  { id: 'p5', name: '상품5', price: 25000, quantity: 10 },
];

const ShoppingCart: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>(INITIAL_PRODUCT_LIST[0].id);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalItemCount, setTotalItemCount] = useState(0);
  const [currentDiscountRate, setCurrentDiscountRate] = useState(0);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCT_LIST);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadCartFromLocalStorage();
    const cleanupDiscountEvents = setupDiscountEvents();
    displayCurrentDate();
    return cleanupDiscountEvents;
  }, []);

  useEffect(() => {
    saveCartToLocalStorage();
  }, [cartItems, totalAmount, totalItemCount, loyaltyPoints]);

  const calculateCart = useCallback(
    (items: CartItem[], date: Date = new Date()) => {
      let newTotalAmount = 0;
      let newTotalItemCount = 0;
      let subTotal = 0;

      items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return;

        const productTotalPrice = product.price * item.quantity;
        newTotalItemCount += item.quantity;
        subTotal += productTotalPrice;

        const discount = item.quantity >= 10 ? DISCOUNT_RATES[product.id] || 0 : 0;
        newTotalAmount += productTotalPrice * (1 - discount);
      });

      let newDiscountRate = 0;

      if (newTotalItemCount >= BULK_DISCOUNT_THRESHOLD) {
        const bulkDisc = newTotalAmount * BULK_DISCOUNT_RATE;
        const itemDisc = subTotal - newTotalAmount;
        if (bulkDisc > itemDisc) {
          newTotalAmount = subTotal * (1 - BULK_DISCOUNT_RATE);
          newDiscountRate = BULK_DISCOUNT_RATE;
        } else {
          newDiscountRate = (subTotal - newTotalAmount) / subTotal;
        }
      } else {
        newDiscountRate = (subTotal - newTotalAmount) / subTotal;
      }

      if (date.getDay() === 2) {
        // 2는 화요일
        newTotalAmount *= 1 - TUESDAY_DISCOUNT_RATE;
        newDiscountRate = TUESDAY_DISCOUNT_RATE;
      }

      const newLoyaltyPoints = Math.floor(newTotalAmount / POINT_RATE);

      return {
        totalAmount: newTotalAmount,
        totalItemCount: newTotalItemCount,
        currentDiscountRate: newDiscountRate,
        loyaltyPoints: newLoyaltyPoints,
      };
    },
    [products],
  );

  function addProductToCart(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product || product.quantity <= 0) {
      alert('선택한 상품의 재고가 없습니다.');
      return;
    }

    const newCartItems = [...cartItems];
    const existingItem = newCartItems.find((item) => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      newCartItems.push({ productId, quantity: 1 });
    }

    const newProducts = products.map((p) => (p.id === productId ? { ...p, quantity: p.quantity - 1 } : p));

    const { totalAmount, totalItemCount, currentDiscountRate, loyaltyPoints } = calculateCart(
      newCartItems,
      currentDate,
    );

    setCartItems(newCartItems);
    setProducts(newProducts);
    setTotalAmount(totalAmount);
    setTotalItemCount(totalItemCount);
    setCurrentDiscountRate(currentDiscountRate);
    setLoyaltyPoints(loyaltyPoints);
    setSelectedProductId(productId);

    saveCartToLocalStorage();
  }

  function handleChangeItemQuantity(productId: string, change: number) {
    const newCartItems = cartItems
      .map((item) => {
        if (item.productId === productId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);

    const newProducts = products.map((p) => (p.id === productId ? { ...p, quantity: p.quantity - change } : p));

    const { totalAmount, totalItemCount, currentDiscountRate, loyaltyPoints } = calculateCart(
      newCartItems,
      currentDate,
    );

    setCartItems(newCartItems);
    setProducts(newProducts);
    setTotalAmount(totalAmount);
    setTotalItemCount(totalItemCount);
    setCurrentDiscountRate(currentDiscountRate);
    setLoyaltyPoints(loyaltyPoints);

    saveCartToLocalStorage();
  }

  function handleRemoveCartItem(productId: string) {
    const removedItem = cartItems.find((item) => item.productId === productId);
    if (removedItem) {
      const newProducts = products.map((p) =>
        p.id === productId ? { ...p, quantity: p.quantity + removedItem.quantity } : p,
      );
      const newCartItems = cartItems.filter((item) => item.productId !== productId);

      const { totalAmount, totalItemCount, currentDiscountRate, loyaltyPoints } = calculateCart(
        newCartItems,
        currentDate,
      );

      setProducts(newProducts);
      setCartItems(newCartItems);
      setTotalAmount(totalAmount);
      setTotalItemCount(totalItemCount);
      setCurrentDiscountRate(currentDiscountRate);
      setLoyaltyPoints(loyaltyPoints);

      saveCartToLocalStorage();
    }
  }

  function saveCartToLocalStorage() {
    const cartState: CartState = {
      items: cartItems,
      totalAmount,
      totalItemCount,
      loyaltyPoints,
    };
    localStorage.setItem('cartState', JSON.stringify(cartState));
  }

  function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cartState');
    if (savedCart) {
      const cartState: CartState = JSON.parse(savedCart);
      setCartItems(cartState.items);
      setTotalAmount(cartState.totalAmount);
      setTotalItemCount(cartState.totalItemCount);
      setLoyaltyPoints(cartState.loyaltyPoints);

      setProducts((prevProducts) =>
        prevProducts.map((product) => {
          const cartItem = cartState.items.find((item) => item.productId === product.id);
          if (cartItem) {
            return { ...product, quantity: product.quantity - cartItem.quantity };
          }
          return product;
        }),
      );
    }
  }

  function setupDiscountEvents() {
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
  }

  function displayCurrentDate() {
    const dateDisplay = document.getElementById('current-date');
    if (dateDisplay) {
      dateDisplay.textContent = currentDate.toLocaleDateString();
    }
  }

  // DateUtils 객체를 React 컴포넌트 내부 함수로 변환
  const dateUtils = {
    getCurrentDate: () => currentDate,
    setCurrentDate: (date: Date) => {
      setCurrentDate(date);
      const { totalAmount, totalItemCount, currentDiscountRate, loyaltyPoints } = calculateCart(cartItems, date);
      setTotalAmount(totalAmount);
      setTotalItemCount(totalItemCount);
      setCurrentDiscountRate(currentDiscountRate);
      setLoyaltyPoints(loyaltyPoints);
      saveCartToLocalStorage();
    },
    updateDisplay: displayCurrentDate,
  };

  return (
    <div className="bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <h1 className="text-2xl font-bold mb-4">장바구니</h1>
        <div id="cart-items">
          {cartItems.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (!product) return null;
            return (
              <div key={item.productId} className="flex justify-between items-center mb-2">
                <span>
                  {product.name} - {product.price}원 x {item.quantity}
                </span>
                <div>
                  <button
                    onClick={() => handleChangeItemQuantity(item.productId, -1)}
                    className="bg-blue-500 text-white px-2 py-1 rounded mr-1"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleChangeItemQuantity(item.productId, 1)}
                    className="bg-blue-500 text-white px-2 py-1 rounded mr-1"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleRemoveCartItem(item.productId)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div id="cart-total" className="text-xl font-bold my-4">
          총액: {Math.round(totalAmount)}원
          {currentDiscountRate > 0 && (
            <span className="text-green-500 ml-2">({(currentDiscountRate * 100).toFixed(1)}% 할인 적용)</span>
          )}
          <span id="loyalty-points" className="text-blue-500 ml-2">
            (포인트: {loyaltyPoints})
          </span>
        </div>
        <select
          id="product-select"
          className="border rounded p-2 mr-2"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          {products.map((product) => (
            <option key={product.id} value={product.id} disabled={product.quantity === 0}>
              {product.name} - {product.price}원
            </option>
          ))}
        </select>
        <button
          onClick={() => addProductToCart(selectedProductId)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
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
        <div id="current-date" className="text-sm text-gray-500 mt-4">
          현재 날짜: {currentDate.toLocaleDateString()}
        </div>
        <button
          onClick={() => dateUtils.setCurrentDate(new Date(currentDate.getTime() + 86400000))}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          날짜 변경 (1일 추가)
        </button>
      </div>
    </div>
  );
};

export default ShoppingCart;
