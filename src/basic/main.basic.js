/**
 * 개선된 쇼핑몰 장바구니 기능 구현 스크립트
 * 상품 목록 표시, 장바구니 추가/제거, 할인 적용, 포인트 계산, 로컬 스토리지 활용 등의 기능을 포함
 */

// 상수 정의
const DISCOUNT_RATES = {
  p1: 0.1,
  p2: 0.15,
  p3: 0.2,
  p4: 0.05,
  p5: 0.25,
};

const BULK_DISCOUNT_THRESHOLD = 30;
const BULK_DISCOUNT_RATE = 0.25;
const TUESDAY_DISCOUNT_RATE = 0.1;
const DUBBLE_DISCOUNT_RATE = 0.95;
const POINT_RATE = 1000;
const STOCK_WARNING_THRESHOLD = 5;
const LIGHTNING_SALE_PROBABILITY = 0.3;
const LIGHTNING_SALE_DISCOUNT = 0.8;

// 상품 목록
const PRODUCT_LIST = [
  { id: 'p1', name: '상품1', val: 10000, q: 50 },
  { id: 'p2', name: '상품2', val: 20000, q: 30 },
  { id: 'p3', name: '상품3', val: 30000, q: 20 },
  { id: 'p4', name: '상품4', val: 15000, q: 0 },
  { id: 'p5', name: '상품5', val: 25000, q: 10 },
];

// 전역 변수 선언
let selectedProductId = null,
  loyaltyPoints = 0,
  totalPrice = 0,
  totalItems = 0,
  currentDiscountRate = 0;

// DOM 요소들을 위한 전역 변수
let rootElement,
  cartContainer,
  cartWrapper,
  cartTitle,
  cartItemList,
  cartTotalDisplay,
  discountDisplay,
  productDropdown,
  addToCartButton,
  stockStatusDisplay;

/**
 * 초기 설정 및 이벤트 설정
 * DOM 요소 초기화, 로컬 스토리지에서 장바구니 상태 로드, 할인 이벤트 설정 등을 수행
 */
export function main() {
  initializeDOM();
  loadCartFromLocalStorage();
  updateSelectOptions();
  calculateCart();
  setupDiscountEvents();
  displayCurrentDate();
  setupEventListeners();
}

/**
 * DOM 요소 초기화
 */
function initializeDOM() {
  rootElement = document.getElementById('app');
  if (!rootElement) {
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
  cartContainer = createElement('div', { id: 'cart-container', className: 'bg-gray-100 p-8' });
  cartWrapper = createElement('div', {
    className: 'max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8',
  });
  cartTitle = createElement('h1', { className: 'text-2xl font-bold mb-4', textContent: '장바구니' });
  cartItemList = createElement('div', { id: 'cart-items' });
  cartTotalDisplay = createElement('div', { id: 'cart-total', className: 'text-xl font-bold my-4' });
  discountDisplay = createElement('span', { id: 'sale-rate' });
  productDropdown = createElement('select', { id: 'product-select', className: 'border rounded p-2 mr-2' });
  addToCartButton = createElement('button', {
    id: 'add-to-cart',
    className: 'bg-blue-500 text-white px-4 py-2 rounded',
    textContent: '추가',
  });
  stockStatusDisplay = createElement('div', { id: 'stock-status', className: 'text-sm text-gray-500 mt-2' });
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
  cartWrapper.append(
    cartTitle,
    cartItemList,
    cartTotalDisplay,
    discountDisplay,
    productDropdown,
    addToCartButton,
    stockStatusDisplay,
  );
  cartContainer.appendChild(cartWrapper);
  rootElement.appendChild(cartContainer);
}

/**
 * 상품 선택 옵션 업데이트
 */
function updateSelectOptions() {
  productDropdown.innerHTML = '';
  PRODUCT_LIST.forEach(function (item) {
    const option = createElement('option', {
      value: item.id,
      textContent: `${item.name} - ${item.val}원`,
      disabled: item.q === 0,
    });
    productDropdown.appendChild(option);
  });
}

/**
 * 장바구니 총액 계산
 * @param {Date} [currentDate] - 현재 날짜 (옵션)
 */
function calculateCart(currentDate = new Date()) {
  if (!cartItemList) {
    return;
  }

  totalPrice = 0;
  totalItems = 0;
  const cartItems = cartItemList.children;
  let subTotal = 0;

  Array.from(cartItems).forEach((item) => {
    const product = PRODUCT_LIST.find((p) => p.id === item.id);
    if (!product) {
      return;
    }

    const currentQuantity = parseInt(item.querySelector('span').textContent.split('x ')[1]);
    const productTotalPrice = product.val * currentQuantity;
    totalItems += currentQuantity;
    subTotal += productTotalPrice;

    const discount = currentQuantity >= 10 ? DISCOUNT_RATES[product.id] || 0 : 0;
    totalPrice += productTotalPrice * (1 - discount);
  });

  applyBulkPurchaseDiscount(subTotal);
  applyTuesdayDiscount(currentDate);
  updateCartTotalDisplay();
  updateStockInfo();
  updateLoyaltyPoints();
  saveCartToLocalStorage();
}

/**
 * 대량 구매 할인 적용
 * @param {number} subTotal - 할인 전 소계
 */
function applyBulkPurchaseDiscount(subTotal) {
  if (totalItems >= BULK_DISCOUNT_THRESHOLD) {
    const bulkDisc = totalPrice * BULK_DISCOUNT_RATE;
    const itemDisc = subTotal - totalPrice;
    if (bulkDisc > itemDisc) {
      totalPrice = subTotal * (1 - BULK_DISCOUNT_RATE);
      currentDiscountRate = BULK_DISCOUNT_RATE;
    } else {
      currentDiscountRate = (subTotal - totalPrice) / subTotal;
    }
  } else {
    currentDiscountRate = (subTotal - totalPrice) / subTotal;
  }
}

/**
 * 화요일 특별 할인 적용
 * @param {Date} currentDate - 현재 날짜
 */
function applyTuesdayDiscount(currentDate) {
  if (currentDate.getDay() === 2) {
    // 2는 화요일
    totalPrice *= 1 - TUESDAY_DISCOUNT_RATE;
    updateDiscountRateDisplay(TUESDAY_DISCOUNT_RATE);
  }
}

/**
 * 할인율 표시 업데이트
 * @param {number} rate  - 적용된 할인율
 */
function updateDiscountRateDisplay(rate) {
  discountDisplay.textContent = `(${(rate * 100).toFixed(1)}% 할인 적용)`;
}

/**
 * 장바구니 총액 표시 업데이트
 */
function updateCartTotalDisplay() {
  cartTotalDisplay.textContent = `총액: ${Math.round(totalPrice)}원`;

  if (currentDiscountRate > 0) {
    const span = createElement('span', {
      className: 'text-green-500 ml-2',
      textContent: `(${(currentDiscountRate * 100).toFixed(1)}% 할인 적용)`,
    });
    cartTotalDisplay.appendChild(span);
  }

  renderBonusPoints();
}

/**
 * 재고 상태 업데이트
 */
function updateStockInfo() {
  let infoMsg = '';
  PRODUCT_LIST.forEach(function (item) {
    if (item.q < STOCK_WARNING_THRESHOLD) {
      infoMsg += `${item.name}: ${item.q > 0 ? `재고 부족 (${item.q}개 남음)` : '품절'}\n`;
    }
  });
  stockStatusDisplay.textContent = infoMsg;
}

/**
 * 적립 포인트 계산 및 표시
 */
function updateLoyaltyPoints() {
  loyaltyPoints = Math.floor(totalPrice / POINT_RATE);
  renderBonusPoints();
}

/**
 * 적립 포인트 표시
 */
function renderBonusPoints() {
  let ptsTag = document.getElementById('loyalty-points');
  if (!ptsTag) {
    ptsTag = createElement('span', {
      id: 'loyalty-points',
      className: 'text-blue-500 ml-2',
    });
    cartTotalDisplay.appendChild(ptsTag);
  }
  ptsTag.textContent = `(포인트: ${loyaltyPoints})`;
}

/**
 * 상품을 장바구니에 추가
 * @param {string} productId - 선택된 상품의 ID
 */
function addProductToCart(productId) {
  const product = PRODUCT_LIST.find((p) => p.id === productId);
  if (!product || product.q <= 0) {
    alert('선택한 상품의 재고가 없습니다.');
    return;
  }

  const existingItem = document.getElementById(productId);
  if (existingItem) {
    updateExistingCartItem(existingItem, product);
  } else {
    addNewCartItem(product);
  }

  calculateCart();
  selectedProductId = productId;
  saveCartToLocalStorage();
}

/**
 * 기존 장바구니 항목 업데이트
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} product - 상품 객체
 */
function updateExistingCartItem(item, product) {
  const quantitySpan = item.querySelector('span');
  const currentQuantity = parseInt(quantitySpan.textContent.split('x ')[1]);
  const newQuantity = currentQuantity + 1;

  if (newQuantity <= product.q + currentQuantity) {
    quantitySpan.textContent = `${product.name} - ${product.val}원 x ${newQuantity}`;
    product.q--;
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
      <span>${product.name} - ${product.val}원 x 1</span>
      <div>
        <button class="quantity-change bg-blue-500 text-white px-2 py-1 rounded mr-1" data-product-id="${product.id}" data-change="-1">-</button>
        <button class="quantity-change bg-blue-500 text-white px-2 py-1 rounded mr-1" data-product-id="${product.id}" data-change="1">+</button>
        <button class="remove-item bg-red-500 text-white px-2 py-1 rounded" data-product-id="${product.id}">삭제</button>
      </div>
    `,
  });
  cartItemList.appendChild(newItem);
  product.q--;
}

/**
 * 장바구니 항목 변경 처리
 * 수량 변경 및 항목 제거 기능을 처리하고 장바구니 상태를 업데이트
 * @param {Event} event - 클릭 이벤트 객체
 */
function handleCartChange(event) {
  const target = event.target;
  if (target.classList.contains('quantity-change') || target.classList.contains('remove-item')) {
    const productId = target.dataset.productId;
    const item = document.getElementById(productId);
    const product = PRODUCT_LIST.find((p) => p.id === productId);

    if (!item || !product) {
      return;
    }

    if (target.classList.contains('quantity-change')) {
      changeItemQuantity(target, item, product);
    } else if (target.classList.contains('remove-item')) {
      removeCartItem(item, product);
    }

    calculateCart();
    saveCartToLocalStorage();
  }
}

/**
 * 장바구니 항목 수량 변경
 * @param {HTMLElement} target - 클릭된 버튼 요소
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} product - 상품 객체
 */
function changeItemQuantity(target, item, product) {
  const change = parseInt(target.dataset.change);
  const quantitySpan = item.querySelector('span');
  const currentQuantity = parseInt(quantitySpan.textContent.split('x ')[1]);
  const newQuantity = currentQuantity + change;

  if (newQuantity > 0 && (change < 0 || product.q > 0)) {
    quantitySpan.textContent = `${product.name} - ${product.val}원 x ${newQuantity}`;
    product.q -= change;
  } else if (newQuantity <= 0) {
    removeCartItem(item, product);
  } else {
    alert('재고가 부족합니다.');
  }
}

/**
 * 장바구니 항목 제거
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} product - 상품 객체
 */
function removeCartItem(item, product) {
  const removedQuantity = parseInt(item.querySelector('span').textContent.split('x ')[1]);
  product.q += removedQuantity;
  item.remove();
}

/**
 * 장바구니 상태를 로컬 스토리지에 저장
 * 현재 장바구니의 항목, 총 가격, 총 아이템 수, 적립 포인트를 저장
 */
function saveCartToLocalStorage() {
  const cartItems = Array.from(cartItemList.children).map((item) => {
    const productId = item.id;
    const quantity = parseInt(item.querySelector('span').textContent.split('x ')[1]);
    return { productId, quantity };
  });

  const cartState = {
    items: cartItems,
    totalPrice,
    totalItems,
    loyaltyPoints,
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
      const product = PRODUCT_LIST.find((p) => p.id === item.productId);
      if (product) {
        addNewCartItem(product, item.quantity);
        product.q -= item.quantity; // 재고 업데이트
      }
    });

    // 전역 상태 복원
    totalPrice = cartState.totalPrice;
    totalItems = cartState.totalItems;
    loyaltyPoints = cartState.loyaltyPoints;

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
  addToCartButton.addEventListener('click', () => {
    addProductToCart(productDropdown.value);
    saveCartToLocalStorage();
  });
  cartItemList.addEventListener('click', handleCartChange);
}

/**
 * 할인 이벤트 설정
 */
function setupDiscountEvents() {
  setTimeout(function () {
    setInterval(function () {
      const luckyItem = PRODUCT_LIST[Math.floor(Math.random() * PRODUCT_LIST.length)];
      if (Math.random() < LIGHTNING_SALE_PROBABILITY && luckyItem.q > 0) {
        luckyItem.val = Math.round(luckyItem.val * LIGHTNING_SALE_DISCOUNT);
        alert('번개세일! ' + luckyItem.name + '이(가) 20% 할인 중입니다!');
        updateSelectOptions();
      }
    }, 30000);
  }, Math.random() * 10000);

  setTimeout(function () {
    setInterval(function () {
      if (selectedProductId) {
        const suggest = PRODUCT_LIST.find(function (item) {
          return item.id !== selectedProductId && item.q > 0;
        });
        if (suggest) {
          alert(suggest.name + '은(는) 어떠세요? 지금 구매하시면 5% 추가 할인!');
          suggest.val = Math.round(suggest.val * DUBBLE_DISCOUNT_RATE);
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
    dateDisplay = createElement('div', { id: 'current-date' });
    document.body.prepend(dateDisplay);
  }
}

// 날짜 유틸리티 객체
export const dateUtils = {
  _currentDate: new Date(),
  getCurrentDate: function () {
    return new Date(this._currentDate);
  },
  setCurrentDate: function (currentDate) {
    this._currentDate = new Date(currentDate);
    this.updateDisplay();
    if (cartItemList && cartTotalDisplay) {
      calculateCart(currentDate);
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
