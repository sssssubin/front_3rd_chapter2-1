/**
 * 쇼핑몰 장바구니 기능 구현 스크립트
 * 상품 목록 표시, 장바구니 추가/제거, 할인 적용, 포인트 계산 등의 기능을 포함
 */

// 전역 변수 선언
let lastSelected = null,
  bonusPoints = 0,
  totalAmount = 0,
  itemCount = 0,
  newQuantity = 0,
  quantity = 0,
  itemTotal = 0,
  discountRate = 0;

// DOM 요소들을 위한 전역 변수
let root, container, wrapper, title, cartDisplay, sumDisplay, salePrice, productSelect, addButton, stockInfo;

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

// 상품 목록
const PRODUCT_LIST = [
  { id: 'p1', name: '상품1', val: 10000, q: 50 },
  { id: 'p2', name: '상품2', val: 20000, q: 30 },
  { id: 'p3', name: '상품3', val: 30000, q: 20 },
  { id: 'p4', name: '상품4', val: 15000, q: 0 },
  { id: 'p5', name: '상품5', val: 25000, q: 10 },
];

/**
 * 메인 함수: 초기 설정 및 이벤트 설정
 */
export function main() {
  // DOM 요소 생성 및 설정
  root = document.getElementById('app');
  if (!root) {
    console.error("'app' 요소를 찾을 수 없습니다.");
    return;
  }

  createCartElements();
  setupCartStructure();

  // 초기화 로직
  updateSelectOptions();

  // DOM 요소가 모두 초기화되었는지 확인
  if (cartDisplay && sumDisplay && productSelect && addButton && stockInfo) {
    calculateCart();
    setupDiscountEvents();
    displayCurrentDate();
    setupEventListeners();
  } else {
    console.error('Some DOM elements are not initialized');
  }
}

/**
 * 장바구니 UI 요소 생성
 */
function createCartElements() {
  container = document.createElement('div');
  wrapper = document.createElement('div');
  title = document.createElement('h1');
  cartDisplay = document.createElement('div');
  sumDisplay = document.createElement('div');
  salePrice = document.createElement('span');
  productSelect = document.createElement('select');
  addButton = document.createElement('button');
  stockInfo = document.createElement('div');

  // 요소 속성 설정
  setElementAttributes();
}

/**
 * 장바구니 UI 요소 속성 설정
 */
function setElementAttributes() {
  container.id = 'cart-container';
  container.className = 'bg-gray-100 p-8';

  wrapper.className = 'max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8';

  title.className = 'text-2xl font-bold mb-4';
  title.textContent = '장바구니';

  cartDisplay.id = 'cart-items';

  sumDisplay.id = 'cart-total';
  sumDisplay.className = 'text-xl font-bold my-4';

  salePrice.id = 'sale-rate';

  productSelect.id = 'product-select';
  productSelect.className = 'border rounded p-2 mr-2';

  addButton.id = 'add-to-cart';
  addButton.className = 'bg-blue-500 text-white px-4 py-2 rounded';
  addButton.textContent = '추가';

  stockInfo.id = 'stock-status';
  stockInfo.className = 'text-sm text-gray-500 mt-2';
}

/**
 * 장바구니 UI 구조 설정
 */
function setupCartStructure() {
  wrapper.append(title, cartDisplay, sumDisplay, salePrice, productSelect, addButton, stockInfo);
  container.appendChild(wrapper);
  root.appendChild(container);
}

/**
 * 상품 선택 옵션 업데이트 함수
 */
function updateSelectOptions() {
  productSelect.innerHTML = '';
  PRODUCT_LIST.forEach(function (item) {
    const option = document.createElement('option');
    option.value = item.id;

    option.textContent = item.name + ' - ' + item.val + '원';
    if (item.q === 0) {
      option.disabled = true;
    }
    productSelect.appendChild(option);
  });
}

/**
 * 장바구니 총액 계산 함수
 * @param {Date} [currentDate] - 현재 날짜 (옵션)
 */
function calculateCart(currentDate) {
  if (!cartDisplay) {
    return;
  }
  totalAmount = 0;
  itemCount = 0;
  const cartItems = cartDisplay.children;
  let subTotal = 0;

  // 각 상품별 계산
  for (let i = 0; i < cartItems.length; i++) {
    (function () {
      let product;

      for (let j = 0; j < PRODUCT_LIST.length; j++) {
        if (PRODUCT_LIST[j].id === cartItems[i].id) {
          product = PRODUCT_LIST[j];
          break;
        }
      }

      quantity = parseInt(cartItems[i].querySelector('span').textContent.split('x ')[1]);
      itemTotal = product.val * quantity;
      itemCount += quantity;
      subTotal += itemTotal;

      let discount = 0;

      // 수량 할인 적용
      // if(quantity >= 10) {
      //   if(product.id === 'p1') {discount=0.1;}
      //   else if(product.id === 'p2') {discount=0.15;}
      //   else if(product.id === 'p3') {discount=0.2;}
      //   else if(product.id === 'p4') {discount=0.05;}
      //   else if(product.id === 'p5') {discount=0.25;}
      // }
      discount = quantity >= 10 ? DISCOUNT_RATES[product.id] || 0 : 0;
      totalAmount += itemTotal * (1 - discount);
    })();
  }

  applyBulkPurchaseDiscount(subTotal);
  applyTuesdayDiscount(currentDate);
  updateCartTotalDisplay();
  updateStockInfo();
  renderbonusPoints();
}

/**
 * 대량 구매 할인 적용
 * @param {number} subTotal - 할인 전 소계
 */
function applyBulkPurchaseDiscount(subTotal) {
  if (itemCount >= BULK_DISCOUNT_THRESHOLD) {
    const bulkDisc = totalAmount * BULK_DISCOUNT_RATE;
    const itemDisc = subTotal - totalAmount;
    if (bulkDisc > itemDisc) {
      totalAmount = subTotal * (1 - BULK_DISCOUNT_RATE);
      discountRate = BULK_DISCOUNT_RATE;
    } else {
      discountRate = (subTotal - totalAmount) / subTotal;
    }
  } else {
    discountRate = (subTotal - totalAmount) / subTotal;
  }
}

/**
 * 화요일 특별 할인 적용
 * @param {Date} currentDate - 현재 날짜
 */
function applyTuesdayDiscount(currentDate) {
  // 화요일 할인 적용
  const date = new Date(currentDate);
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 2) {
    // 2는 화요일
    console.log('요일 (0-6):', dayOfWeek === 2 && '화');

    totalAmount *= 1 - TUESDAY_DISCOUNT_RATE;
    updateDiscountRateDisplay(TUESDAY_DISCOUNT_RATE);
  }
}

/**
 * 할인율 표시 업데이트
 * @param {number} discountRate - 적용된 할인율
 */
function updateDiscountRateDisplay(discountRate) {
  salePrice.textContent = `(${(discountRate * 100).toFixed(1)}% 할인 적용)`;
}

/**
 * 장바구니 총액 표시 업데이트
 */
function updateCartTotalDisplay() {
  sumDisplay.textContent = '총액: ' + Math.round(totalAmount) + '원';

  if (discountRate > 0) {
    const span = document.createElement('span');
    span.className = 'text-green-500 ml-2';
    span.textContent = '(' + (discountRate * 100).toFixed(1) + '% 할인 적용)';
    sumDisplay.appendChild(span);
  }
}

/**
 * 재고 상태 업데이트 함수
 */
function renderbonusPoints() {
  bonusPoints = Math.floor(totalAmount / POINT_RATE);
  let ptsTag = document.getElementById('loyalty-points');
  if (!ptsTag) {
    ptsTag = document.createElement('span');
    ptsTag.id = 'loyalty-points';
    ptsTag.className = 'text-blue-500 ml-2';
    sumDisplay.appendChild(ptsTag);
  }
  ptsTag.textContent = '(포인트: ' + bonusPoints + ')';
}

/**
 * 적립 포인트 계산 및 표시 함수
 */
function updateStockInfo() {
  let infoMsg = '';
  PRODUCT_LIST.forEach(function (item) {
    if (item.q < 5) {
      infoMsg += item.name + ': ' + (item.q > 0 ? '재고 부족 (' + item.q + '개 남음)' : '품절') + '\n';
    }
  });
  stockInfo.textContent = infoMsg;
}

/**
 * 상품을 장바구니에 추가하는 함수
 * @param {string} selItem - 선택된 상품의 ID
 */
function addProductToCart(selItem) {
  const itemToAdd = PRODUCT_LIST.find(function (p) {
    return p.id === selItem;
  });
  if (itemToAdd && itemToAdd.q > 0) {
    const item = document.getElementById(itemToAdd.id);
    if (item) {
      updateExistingCartItem(item, itemToAdd);
    } else {
      addNewCartItem(itemToAdd);
    }
    // 장바구니 총액 계산
    calculateCart();
    lastSelected = selItem;
  }
}

/**
 * 기존 장바구니 항목 업데이트
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} itemToAdd - 추가할 상품 객체
 */
function updateExistingCartItem(item, itemToAdd) {
  newQuantity = parseInt(item.querySelector('span').textContent.split('x ')[1]) + 1;
  if (newQuantity <= itemToAdd.q) {
    item.querySelector('span').textContent = itemToAdd.name + ' - ' + itemToAdd.val + '원 x ' + newQuantity;
    itemToAdd.q--;
  } else {
    alert('재고가 부족합니다.');
  }
}

/**
 * 새 장바구니 항목 추가
 * @param {Object} itemToAdd - 추가할 상품 객체
 */
function addNewCartItem(itemToAdd) {
  const newItem = document.createElement('div');
  newItem.id = itemToAdd.id;
  newItem.className = 'flex justify-between items-center mb-2';
  newItem.innerHTML =
    '<span>' +
    itemToAdd.name +
    ' - ' +
    itemToAdd.val +
    '원 x 1</span><div>' +
    '<button class="quantity-change bg-blue-500 text-white px-2 py-1 rounded mr-1" data-product-id="' +
    itemToAdd.id +
    '" data-change="-1">-</button>' +
    '<button class="quantity-change bg-blue-500 text-white px-2 py-1 rounded mr-1" data-product-id="' +
    itemToAdd.id +
    '" data-change="1">+</button>' +
    '<button class="remove-item bg-red-500 text-white px-2 py-1 rounded" data-product-id="' +
    itemToAdd.id +
    '">삭제</button></div>';
  cartDisplay.appendChild(newItem);
  itemToAdd.q--;
}

/**
 * 장바구니 항목 변경 함수
 * @param {Event} event - 클릭 이벤트 객체
 */
function handleCartChange(event) {
  const target = event.target;
  if (target.classList.contains('quantity-change') || target.classList.contains('remove-item')) {
    const productId = target.dataset.productId;
    const item = document.getElementById(productId);
    const product = PRODUCT_LIST.find((p) => p.id === productId);

    if (target.classList.contains('quantity-change')) {
      changeItemQuantity(target, item, product);
    } else if (target.classList.contains('remove-item')) {
      removeCartItem(item, product);
      bonusPoints = 0;
    }

    // 장바구니 총액 계산
    calculateCart();
  }
}

/**
 * 수량 변경 함수
 * @param {HTMLElement} target - 클릭된 버튼 요소
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} prod - 상품 객체
 */
function changeItemQuantity(target, item, product) {
  const change = parseInt(target.dataset.change);
  const quantitySpan = item.querySelector('span');
  newQuantity = parseInt(quantitySpan.textContent.split('x ')[1]) + change;

  if (newQuantity > 0 && newQuantity <= product.q + parseInt(quantitySpan.textContent.split('x ')[1])) {
    quantitySpan.textContent = `${product.name} - ${product.val}원 x ${newQuantity}`;
    product.q -= change;
    console.log('change add', product.q);
  } else if (newQuantity <= 0 && change === -1) {
    item.remove();
    product.q -= change;
    console.log('change remove', product.q);
  } else {
    alert('재고가 부족합니다.');
  }
}

/**
 * 항목 제거 함수
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} prod - 상품 객체
 */
function removeCartItem(item, product) {
  const removedQuantity = parseInt(item.querySelector('span').textContent.split('x ')[1]);
  product.q += removedQuantity;
  item.remove();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  addButton.addEventListener('click', () => addProductToCart(productSelect.value));
  cartDisplay.addEventListener('click', handleCartChange);
}

/**
 * 할인 이벤트 설정 함수
 */
function setupDiscountEvents() {
  setTimeout(function () {
    setInterval(function () {
      const luckyItem = PRODUCT_LIST[Math.floor(Math.random() * PRODUCT_LIST.length)];
      if (Math.random() < 0.3 && luckyItem.q > 0) {
        luckyItem.val = Math.round(luckyItem.val * 0.8);
        alert('번개세일! ' + luckyItem.name + '이(가) 20% 할인 중입니다!');
        updateSelectOptions();
      }
    }, 30000);
  }, Math.random() * 10000);

  setTimeout(function () {
    setInterval(function () {
      if (lastSelected) {
        const suggest = PRODUCT_LIST.find(function (item) {
          return item.id !== lastSelected && item.q > 0;
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

export const dateUtils = {
  _currentDate: new Date(),
  getCurrentDate: function () {
    return new Date(this._currentDate);
  },
  setCurrentDate: function (currentDate) {
    this._currentDate = new Date(currentDate);
    this.updateDisplay();
    if (cartDisplay && sumDisplay) {
      calculateCart(currentDate);
    } else {
      console.error('DOM 요소가 초기화되지 않았습니다.');
    }
  },
  updateDisplay: function () {
    displayCurrentDate();
  },
};

/**
 * 현재 날짜 표시 함수
 */
function displayCurrentDate() {
  let dateDisplay = document.getElementById('current-date');
  if (!dateDisplay) {
    dateDisplay = document.createElement('div');
    dateDisplay.id = 'current-date';
    document.body.prepend(dateDisplay);
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', main);
}
