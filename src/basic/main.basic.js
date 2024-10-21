/**
 * 개선된 쇼핑몰 장바구니 기능 구현 스크립트
 * 상품 목록 표시, 장바구니 추가/제거, 할인 적용, 포인트 계산, 로컬 스토리지 활용 등의 기능을 포함
 */

// 상수 정의
const CONFIG = {
  DISCOUNT_RATES: {
    p1: 0.1,
    p2: 0.15,
    p3: 0.2,
    p4: 0.05,
    p5: 0.25,
  },
  BULK_DISCOUNT_THRESHOLD: 30,
  BULK_DISCOUNT_RATE: 0.25,
  TUESDAY_DISCOUNT_RATE: 0.1,
  DOUBLE_DISCOUNT_RATE: 0.95,
  POINT_RATE: 1000,
  STOCK_WARNING_THRESHOLD: 5,
  LIGHTNING_SALE_PROBABILITY: 0.3,
  LIGHTNING_SALE_DISCOUNT: 0.8,
};

// 상품 목록
let productList = [
  { id: 'p1', name: '상품1', price: 10000, quantity: 50 },
  { id: 'p2', name: '상품2', price: 20000, quantity: 30 },
  { id: 'p3', name: '상품3', price: 30000, quantity: 20 },
  { id: 'p4', name: '상품4', price: 15000, quantity: 0 },
  { id: 'p5', name: '상품5', price: 25000, quantity: 10 },
];

const state = {
  selectedProductId: null,
  loyaltyPoints: 0,
  totalAmount: 0,
  totalItemCount: 0,
  discountRate: 0,
};

const domElements = {
  rootElement: null,
  cartContainer: null,
  cartWrapper: null,
  cartTitle: null,
  cartItemList: null,
  cartTotalDisplay: null,
  discountDisplay: null,
  productDropdown: null,
  addToCartButton: null,
  stockStatusDisplay: null,
};

/**
 * 초기 설정 및 이벤트 설정
 * DOM 요소 초기화, 로컬 스토리지에서 장바구니 상태 로드, 할인 이벤트 설정 등을 수행
 */
export function main() {
  initializeDOM();
  loadCartFromLocalStorage();
  updateSelectOptions();
  calculateCartTotal();
  setupDiscountEvents();
  displayCurrentDate();
  setupEventListeners();
}

/**
 * DOM 요소 초기화
 */
function initializeDOM() {
  domElements.rootElement = document.getElementById('app');
  if (!domElements.rootElement) {
    console.error("'app' 요소를 찾을 수 없습니다.");
    return;
  }

  createCartElements();
  setupCartStructure();
}

/**
 * 장바구니 UI 요소 생성
 */
function createCartElements() {
  domElements.cartContainer = createElement('div', {
    id: 'cart-container',
    className: 'bg-gray-100 p-8',
  });
  domElements.cartContainer = createElement('div', {
    className:
      'max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8',
  });
  domElements.cartTitle = createElement('h1', {
    className: 'text-2xl font-bold mb-4',
    textContent: '장바구니',
  });
  domElements.cartItemList = createElement('div', { id: 'cart-items' });
  domElements.cartTotalDisplay = createElement('div', {
    id: 'cart-total',
    className: 'text-xl font-bold my-4',
  });
  domElements.discountDisplay = createElement('span', { id: 'sale-rate' });
  domElements.productDropdown = createElement('select', {
    id: 'product-select',
    className: 'border rounded p-2 mr-2',
  });
  domElements.addToCartButton = createElement('button', {
    id: 'add-to-cart',
    className: 'bg-blue-500 text-white px-4 py-2 rounded',
    textContent: '추가',
  });
  domElements.stockStatusDisplay = createElement('div', {
    id: 'stock-status',
    className: 'text-sm text-gray-500 mt-2',
  });
}

/**
 * 요소 생성 헬퍼 함수
 * @param {string} tag - HTML 태그 이름
 * @param {Object} attributes - 요소 속성
 * @returns {HTMLElement} 생성된 요소
 */
function createElement(tag, attributes = {}) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element[key] = value;
  });
  return element;
}

/**
 * 장바구니 UI 구조 설정
 */
function setupCartStructure() {
  domElements.cartContainer.append(
    domElements.cartTitle,
    domElements.cartItemList,
    domElements.cartTotalDisplay,
    domElements.discountDisplay,
    domElements.productDropdown,
    domElements.addToCartButton,
    domElements.stockStatusDisplay,
  );
  domElements.rootElement.appendChild(domElements.cartContainer);
}

/**
 * 상품 선택 옵션 업데이트
 */
function updateSelectOptions() {
  domElements.productDropdown.innerHTML = '';
  productList.forEach(function (product) {
    const option = createElement('option', {
      value: product.id,
      textContent: `${product.name} - ${product.price}원`,
      disabled: product.quantity === 0,
    });
    domElements.productDropdown.appendChild(option);
  });
}

/**
 * 장바구니 총액 계산
 * @param {Array} cartItems - 장바구니 아이템 목록
 * @returns {number} 총액
 */
function calculateCartTotal(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return 0;
  }

  return cartItems.reduce((total, item) => {
    const product = productList.find((p) => p.id === item.id);
    if (!product) {
      return total;
    }

    const quantity = parseInt(
      item.querySelector('span').textContent.split('x ')[1],
    );
    const productTotal = product.price * quantity;
    const discount =
      quantity >= 10 ? CONFIG.DISCOUNT_RATES[product.id] || 0 : 0;

    return total + productTotal * (1 - discount);
  }, 0);
}

/**
 * 장바구니 아이템 수 계산
 * @param {Array} cartItems - 장바구니 아이템 목록
 * @returns {number} 총 아이템 수
 */
function calculateTotalItemCount(cartItems) {
  return cartItems.reduce((count, item) => {
    const quantity = parseInt(
      item.querySelector('span').textContent.split('x ')[1],
    );
    return count + quantity;
  }, 0);
}

/**
 * 대량 구매 할인 적용
 * @param {number} total - 할인 전 총액
 * @param {number} itemCount - 총 아이템 수
 * @returns {number} 할인 후 총액
 */
function applyBulkPurchaseDiscount(total, itemCount) {
  if (itemCount >= CONFIG.BULK_DISCOUNT_THRESHOLD) {
    return total * (1 - CONFIG.BULK_DISCOUNT_RATE);
  }
  return total;
}

/**
 * 화요일 특별 할인 적용
 * @param {number} total - 할인 전 총액
 * @param {Date} currentDate - 현재 날짜
 * @returns {number} 할인 후 총액
 */
function applyTuesdayDiscount(total, currentDate) {
  if (currentDate.getDay() === 2) {
    // 2는 화요일
    return total * (1 - CONFIG.TUESDAY_DISCOUNT_RATE);
  }
  return total;
}

/**
 * 장바구니 상태 계산
 * @param {Array} cartItems - 장바구니 아이템 목록
 * @param {Date} currentDate - 현재 날짜
 * @returns {Object} 계산된 장바구니 상태
 */
function calculateCartState(cartItems, currentDate) {
  const originalTotal = calculateCartTotal(cartItems);
  const totalItemCount = calculateTotalItemCount(cartItems);
  const bulkDiscountedTotal = applyBulkPurchaseDiscount(
    originalTotal,
    totalItemCount,
  );
  const finalTotal = applyTuesdayDiscount(bulkDiscountedTotal, currentDate);
  const totalDiscount = (originalTotal - finalTotal) / originalTotal;

  return {
    totalAmount: finalTotal,
    totalItemCount: totalItemCount,
    discountRate: totalDiscount,
  };
}

/**
 * 장바구니 상태 업데이트
 * @param {Object} newState - 새로운 장바구니 상태
 */
function updateCartState(newState) {
  state.totalAmount = newState.totalAmount;
  state.totalItemCount = newState.totalItemCount;
  state.discountRate = newState.discountRate;
}

/**
 * UI 업데이트
 */
function updateUI() {
  updateCartTotalDisplay();
  updateDiscountRateDisplay(state.discountRate);
  updateStockInfo();
  updateLoyaltyPoints();
}

/**
 * 장바구니 상태 업데이트 및 UI 반영
 * @param {Date} [currentDate=new Date()] - 현재 날짜 (옵션)
 */
function updateCart(currentDate = new Date()) {
  if (!domElements.cartItemList) {
    console.error('장바구니 요소를 찾을 수 없습니다.');
    return;
  }

  const cartItems = Array.from(domElements.cartItemList.children);
  const newState = calculateCartState(cartItems, currentDate);
  updateCartState(newState);
  updateUI();
  saveCartToLocalStorage();
}

/**
 * 할인율 표시 업데이트
 * @param {number} rate - 적용된 할인율
 */
function updateDiscountRateDisplay(rate) {
  if (rate > 0) {
    domElements.discountDisplay.textContent = `(${(rate * 100).toFixed(
      1,
    )}% 할인 적용)`;
  }
}

/**
 * 장바구니 총액 표시 업데이트
 */
function updateCartTotalDisplay() {
  domElements.cartTotalDisplay.textContent = `총액: ${Math.round(
    state.totalAmount,
  )}원`;
  renderBonusPoints();
}

/**
 * 재고 상태 업데이트
 */
function updateStockInfo() {
  let infoMsg = '';
  productList.forEach(function (product) {
    if (product.quantity < CONFIG.STOCK_WARNING_THRESHOLD) {
      infoMsg += `${product.name}: ${
        product.quantity > 0 ? `재고 부족 (${product.quantity}개 남음)` : '품절'
      }\n`;
    }
  });
  domElements.stockStatusDisplay.textContent = infoMsg;
}

/**
 * 적립 포인트 계산 및 표시
 */
function updateLoyaltyPoints() {
  state.loyaltyPoints = Math.floor(state.totalAmount / CONFIG.POINT_RATE);
  renderBonusPoints();
}

/**
 * 적립 포인트 표시
 */
function renderBonusPoints() {
  let pointsTag = document.getElementById('loyalty-points');
  if (!pointsTag) {
    pointsTag = createElement('span', {
      id: 'loyalty-points',
      className: 'text-blue-500 ml-2',
    });
    domElements.cartTotalDisplay.appendChild(pointsTag);
  }
  pointsTag.textContent = `(포인트: ${state.loyaltyPoints})`;
}

/**
 * 상품을 장바구니에 추가
 * @param {string} productId - 선택된 상품의 ID
 */
function addProductToCart(productId) {
  const product = productList.find((product) => product.id === productId);
  if (!product || product.quantity <= 0) {
    alert('선택한 상품의 재고가 없습니다.');
    return;
  }

  const existingItem = document.getElementById(productId);
  if (existingItem) {
    updateExistingCartItem(existingItem, product);
  } else {
    addNewCartItem(product);
  }

  updateCart();
  state.selectedProductId = productId;
  saveCartToLocalStorage();
}

/**
 * 기존 장바구니 항목 업데이트
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} product - 상품 객체
 */
function updateExistingCartItem(item, product) {
  const quantitySpan = item.querySelector('span');
  const quantity = parseInt(quantitySpan.textContent.split('x ')[1]);
  const newQuantity = quantity + 1;

  if (newQuantity <= product.quantity + quantity) {
    quantitySpan.textContent = `${product.name} - ${product.price}원 x ${newQuantity}`;
    product.quantity--;
  } else {
    alert('재고가 부족합니다.');
  }
}

/**
 * 새 장바구니 항목 추가
 * @param {Object} product - 추가할 상품 객체
 */
function addNewCartItem(product) {
  const newItem = createElement('div', {
    id: product.id,
    className: 'flex justify-between items-center mb-2',
    innerHTML: `
      <span>${product.name} - ${product.price}원 x 1</span>
      <div>
        <button class="quantity-change bg-blue-500 text-white px-2 py-1 rounded mr-1" data-product-id="${product.id}" data-change="-1">-</button>
        <button class="quantity-change bg-blue-500 text-white px-2 py-1 rounded mr-1" data-product-id="${product.id}" data-change="1">+</button>
        <button class="remove-item bg-red-500 text-white px-2 py-1 rounded" data-product-id="${product.id}">삭제</button>
      </div>
    `,
  });
  domElements.cartItemList.appendChild(newItem);
  product.quantity--;
}

/**
 * 장바구니 항목 변경 처리
 * 수량 변경 및 항목 제거 기능을 처리하고 장바구니 상태를 업데이트
 * @param {Event} event - 클릭 이벤트 객체
 */
function handleCartChange(event) {
  const target = event.target;
  if (
    target.classList.contains('quantity-change') ||
    target.classList.contains('remove-item')
  ) {
    const productId = target.dataset.productId;
    const item = document.getElementById(productId);
    const product = productList.find((product) => product.id === productId);

    if (!item || !product) {
      return;
    }

    if (target.classList.contains('quantity-change')) {
      handleChangeItemQuantity(target, item, product);
    } else if (target.classList.contains('remove-item')) {
      handleRemoveCartItem(item, product);
    }

    updateCart();
    saveCartToLocalStorage();
  }
}

/**
 * 장바구니 항목 수량 변경
 * @param {HTMLElement} target - 클릭된 버튼 요소
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} product - 상품 객체
 */
function handleChangeItemQuantity(target, item, product) {
  const change = parseInt(target.dataset.change);
  const quantitySpan = item.querySelector('span');
  const quantity = parseInt(quantitySpan.textContent.split('x ')[1]);
  const newQuantity = quantity + change;

  if (newQuantity > 0 && (change < 0 || product.quantity > 0)) {
    quantitySpan.textContent = `${product.name} - ${product.price}원 x ${newQuantity}`;
    product.quantity -= change;
  } else if (newQuantity <= 0) {
    handleRemoveCartItem(item, product);
  } else {
    alert('재고가 부족합니다.');
  }
}

/**
 * 장바구니 항목 제거
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} product - 상품 객체
 */
function handleRemoveCartItem(item, product) {
  const removedQuantity = parseInt(
    item.querySelector('span').textContent.split('x ')[1],
  );
  product.quantity += removedQuantity;
  item.remove();
}

/**
 * 장바구니 상태를 로컬 스토리지에 저장
 * 현재 장바구니의 항목, 총 가격, 총 아이템 수, 적립 포인트를 저장
 */
function saveCartToLocalStorage() {
  const cartItems = Array.from(domElements.cartItemList.children).map(
    (item) => {
      const productId = item.id;
      const quantity = parseInt(
        item.querySelector('span').textContent.split('x ')[1],
      );
      return { productId, quantity };
    },
  );

  const cartState = {
    items: cartItems,
    totalAmount: state.totalAmount,
    totalItemCount: state.totalItemCount,
    loyaltyPoints: state.loyaltyPoints,
  };

  localStorage.setItem('cartState', JSON.stringify(cartState));
}

/**
 * 로컬 스토리지에서 장바구니 상태 불러오기
 * 저장된 장바구니 상태를 복원하고 UI를 업데이트
 */
function loadCartFromLocalStorage() {
  const savedCart = localStorage.getItem('cartState');
  if (savedCart) {
    const cartState = JSON.parse(savedCart);

    // 장바구니 아이템 복원
    cartState.items.forEach((item) => {
      const product = productList.find(
        (product) => product.id === item.productId,
      );
      if (product) {
        addNewCartItem(product, item.quantity);
        product.quantity -= item.quantity; // 재고 업데이트
      }
    });

    // 전역 상태 복원
    state.totalAmount = cartState.totalAmount;
    state.totalItemCount = cartState.totalItemCount;
    state.loyaltyPoints = cartState.loyaltyPoints;

    // UI 업데이트
    updateCartTotalDisplay();
    updateLoyaltyPoints();
    updateStockInfo();
  }
}

/**
 * 이벤트 리스너 설정
 * 장바구니 추가 버튼과 장바구니 항목 변경에 대한 이벤트 리스너를 설정
 */
function setupEventListeners() {
  domElements.addToCartButton.addEventListener('click', () => {
    addProductToCart(domElements.productDropdown.value);
    saveCartToLocalStorage();
  });
  domElements.cartItemList.addEventListener('click', handleCartChange);
}

/**
 * 할인 이벤트 설정
 */
function setupDiscountEvents() {
  setTimeout(function () {
    setInterval(function () {
      const luckyItem =
        productList[Math.floor(Math.random() * productList.length)];
      if (
        Math.random() < CONFIG.LIGHTNING_SALE_PROBABILITY &&
        luckyItem.q > 0
      ) {
        luckyItem.val = Math.round(
          luckyItem.val * CONFIG.LIGHTNING_SALE_DISCOUNT,
        );
        alert('번개세일! ' + luckyItem.name + '이(가) 20% 할인 중입니다!');
        updateSelectOptions();
      }
    }, 30000);
  }, Math.random() * 10000);

  setTimeout(function () {
    setInterval(function () {
      if (state.selectedProductId) {
        const suggest = productList.find(function (product) {
          return product.id !== state.selectedProductId && product.quantity > 0;
        });
        if (suggest) {
          alert(
            suggest.name + '은(는) 어떠세요? 지금 구매하시면 5% 추가 할인!',
          );
          suggest.val = Math.round(suggest.val * CONFIG.DOUBLE_DISCOUNT_RATE);
          updateSelectOptions();
        }
      }
    }, 60000);
  }, Math.random() * 20000);
}

/**
 * 현재 날짜 표시
 */
function displayCurrentDate() {
  let dateDisplay;
  if (!dateDisplay) {
    dateDisplay = createElement('div', { id: 'date' });
    document.body.prepend(dateDisplay);
  }
}

// 날짜 유틸리티 객체
export const dateUtils = {
  _date: new Date(),
  getCurrentDate: function () {
    return new Date(this._date);
  },
  setCurrentDate: function (date) {
    this._date = new Date(date);
    this.updateDisplay();
    if (domElements.cartItemList && domElements.cartTotalDisplay) {
      updateCart(date);
    } else {
      console.error('DOM 요소가 초기화되지 않았습니다.');
    }
  },
  updateDisplay: function () {
    displayCurrentDate();
  },
};

// DOM이 로드되면 main 함수 실행
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', main);
}
