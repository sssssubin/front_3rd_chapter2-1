/**
 * 쇼핑몰 장바구니 기능 구현 스크립트
 * 상품 목록 표시, 장바구니 추가/제거, 할인 적용, 포인트 계산 등의 기능을 포함
 */

// 전역 변수 선언
let prodList, sel, addBtn, cartDisp, sum, stockInfo;
let lastSel,
  bonusPts = 0,
  totalAmt = 0,
  itemCnt = 0;

/**
 * 메인 함수: 초기 설정 및 이벤트 설정
 */
function main() {
  // 상품 목록
  prodList = [
    { id: 'p1', name: '상품1', val: 10000, q: 50 },
    { id: 'p2', name: '상품2', val: 20000, q: 30 },
    { id: 'p3', name: '상품3', val: 30000, q: 20 },
    { id: 'p4', name: '상품4', val: 15000, q: 0 },
    { id: 'p5', name: '상품5', val: 25000, q: 10 },
  ];

  // DOM 요소 생성 및 설정
  const root = document.getElementById('app');
  const cont = document.createElement('div');
  const wrap = document.createElement('div');
  const hTxt = document.createElement('h1');

  cartDisp = document.createElement('div');
  sum = document.createElement('div');
  sel = document.createElement('select');
  addBtn = document.createElement('button');
  stockInfo = document.createElement('div');

  // ID 및 클래스 설정
  cartDisp.id = 'cart-items';
  sum.id = 'cart-total';
  sel.id = 'product-select';
  addBtn.id = 'add-to-cart';
  stockInfo.id = 'stock-status';

  cont.className = 'bg-gray-100 p-8';
  wrap.className = 'max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8';
  hTxt.className = 'text-2xl font-bold mb-4';
  sum.className = 'text-xl font-bold my-4';
  sel.className = 'border rounded p-2 mr-2';
  addBtn.className = 'bg-blue-500 text-white px-4 py-2 rounded';
  stockInfo.className = 'text-sm text-gray-500 mt-2';

  hTxt.textContent = '장바구니';
  addBtn.textContent = '추가';

  // 상품 선택 옵션 업데이트
  updateSelOpts();

  // DOM 구조 설정
  wrap.appendChild(hTxt);
  wrap.appendChild(cartDisp);
  wrap.appendChild(sum);
  wrap.appendChild(sel);
  wrap.appendChild(addBtn);
  wrap.appendChild(stockInfo);
  cont.appendChild(wrap);
  root.appendChild(cont);

  // 장바구니 총액 계산
  calcCart();

  // 할인 이벤트 설정
  setupDiscountEvents();
}

/**
 * 상품 선택 옵션 업데이트 함수
 */
function updateSelOpts() {
  sel.innerHTML = '';
  prodList.forEach(function (item) {
    const opt = document.createElement('option');
    opt.value = item.id;

    opt.textContent = item.name + ' - ' + item.val + '원';
    if (item.q === 0) {
      opt.disabled = true;
    }
    sel.appendChild(opt);
  });
}

/**
 * 장바구니 총액 계산 함수
 */
function calcCart() {
  totalAmt = 0;
  itemCnt = 0;
  const cartItems = cartDisp.children;
  let subTot = 0;

  // 각 상품별 계산
  for (let i = 0; i < cartItems.length; i++) {
    (function () {
      let curItem;
      for (let j = 0; j < prodList.length; j++) {
        if (prodList[j].id === cartItems[i].id) {
          curItem = prodList[j];
          break;
        }
      }

      const q = parseInt(cartItems[i].querySelector('span').textContent.split('x ')[1]);
      const itemTot = curItem.val * q;
      let disc = 0;
      itemCnt += q;
      subTot += itemTot;

      // 수량 할인 적용
      if (q >= 10) {
        if (curItem.id === 'p1') {
          disc = 0.1;
        } else if (curItem.id === 'p2') {
          disc = 0.15;
        } else if (curItem.id === 'p3') {
          disc = 0.2;
        } else if (curItem.id === 'p4') {
          disc = 0.05;
        } else if (curItem.id === 'p5') {
          disc = 0.25;
        }
      }
      totalAmt += itemTot * (1 - disc);
    })();
  }

  // 대량 구매 할인 적용
  let discRate = 0;
  if (itemCnt >= 30) {
    const bulkDisc = totalAmt * 0.25;
    const itemDisc = subTot - totalAmt;
    if (bulkDisc > itemDisc) {
      totalAmt = subTot * (1 - 0.25);
      discRate = 0.25;
    } else {
      discRate = (subTot - totalAmt) / subTot;
    }
  } else {
    discRate = (subTot - totalAmt) / subTot;
  }

  // 화요일 할인 적용
  if (new Date().getDay() === 2) {
    totalAmt *= 1 - 0.1;
    discRate = Math.max(discRate, 0.1);
  }

  // 총액 표시 업데이트
  sum.textContent = '총액: ' + Math.round(totalAmt) + '원';
  if (discRate > 0) {
    const span = document.createElement('span');
    span.className = 'text-green-500 ml-2';
    span.textContent = '(' + (discRate * 100).toFixed(1) + '% 할인 적용)';
    sum.appendChild(span);
  }

  // 재고 정보 업데이트
  updateStockInfo();
  renderBonusPts();
}

/**
 * 재고 정보 업데이트 함수
 */
const renderBonusPts = () => {
  bonusPts += Math.floor(totalAmt / 1000);
  let ptsTag = document.getElementById('loyalty-points');
  if (!ptsTag) {
    ptsTag = document.createElement('span');
    ptsTag.id = 'loyalty-points';
    ptsTag.className = 'text-blue-500 ml-2';
    sum.appendChild(ptsTag);
  }
  ptsTag.textContent = '(포인트: ' + bonusPts + ')';
};

// 재고 정보 업데이트 함수
function updateStockInfo() {
  let infoMsg = '';
  prodList.forEach(function (item) {
    if (item.q < 5) {
      infoMsg += item.name + ': ' + (item.q > 0 ? '재고 부족 (' + item.q + '개 남음)' : '품절') + '\n';
    }
  });
  stockInfo.textContent = infoMsg;
}

main();

/**
 * 상품 추가 함수
 * @param {string} selItem - 선택된 상품의 ID
 */
function addProductToCart(selItem) {
  const itemToAdd = prodList.find(function (p) {
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
    calcCart();
    lastSel = selItem;
  }
}

/**
 * 기존 장바구니 항목 업데이트
 * @param {HTMLElement} item - 장바구니 항목 요소
 * @param {Object} itemToAdd - 추가할 상품 객체
 */
function updateExistingCartItem(item, itemToAdd) {
  const newQty = parseInt(item.querySelector('span').textContent.split('x ')[1]) + 1;
  if (newQty <= itemToAdd.q) {
    item.querySelector('span').textContent = itemToAdd.name + ' - ' + itemToAdd.val + '원 x ' + newQty;
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
  cartDisp.appendChild(newItem);
  itemToAdd.q--;
}

/**
 * 장바구니 항목 변경 함수
 * @param {Event} event - 클릭 이벤트 객체
 */
function handleCartChange(event) {
  const tgt = event.target;

  if (tgt.classList.contains('quantity-change') || tgt.classList.contains('remove-item')) {
    const prodId = tgt.dataset.productId;
    const itemElem = document.getElementById(prodId);
    const prod = prodList.find(function (p) {
      return p.id === prodId;
    });
    if (tgt.classList.contains('quantity-change')) {
      changeItemQuantity(tgt, itemElem, prod);
    } else if (tgt.classList.contains('remove-item')) {
      removeCartItem(itemElem, prod);
    }
    // 장바구니 총액 계산
    calcCart();
  }
}

/**
 * 수량 변경 함수
 * @param {HTMLElement} tgt - 클릭된 버튼 요소
 * @param {HTMLElement} itemElem - 장바구니 항목 요소
 * @param {Object} prod - 상품 객체
 */
function changeItemQuantity(tgt, itemElem, prod) {
  const qtyChange = parseInt(tgt.dataset.change);
  const newQty = parseInt(itemElem.querySelector('span').textContent.split('x ')[1]) + qtyChange;

  if (newQty > 0 && newQty <= prod.q + parseInt(itemElem.querySelector('span').textContent.split('x ')[1])) {
    itemElem.querySelector('span').textContent =
      itemElem.querySelector('span').textContent.split('x ')[0] + 'x ' + newQty;
    prod.q -= qtyChange;
  } else if (newQty <= 0) {
    itemElem.remove();
    prod.q -= qtyChange;
  } else {
    alert('재고가 부족합니다.');
  }
}

/**
 * 항목 제거 함수
 * @param {HTMLElement} itemElem - 장바구니 항목 요소
 * @param {Object} prod - 상품 객체
 */
function removeCartItem(itemElem, prod) {
  const remQty = parseInt(itemElem.querySelector('span').textContent.split('x ')[1]);
  prod.q += remQty;
  itemElem.remove();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
  addBtn.addEventListener('click', () => addProductToCart(sel.value));
  cartDisp.addEventListener('click', handleCartChange);
}

// 이벤트 리스너 설정 함수 호출
setupEventListeners();

/**
 * 할인 이벤트 설정 함수
 */
function setupDiscountEvents() {
  setTimeout(function () {
    setInterval(function () {
      const luckyItem = prodList[Math.floor(Math.random() * prodList.length)];
      if (Math.random() < 0.3 && luckyItem.q > 0) {
        luckyItem.val = Math.round(luckyItem.val * 0.8);
        alert('번개세일! ' + luckyItem.name + '이(가) 20% 할인 중입니다!');
        updateSelOpts();
      }
    }, 30000);
  }, Math.random() * 10000);

  setTimeout(function () {
    setInterval(function () {
      if (lastSel) {
        const suggest = prodList.find(function (item) {
          return item.id !== lastSel && item.q > 0;
        });
        if (suggest) {
          alert(suggest.name + '은(는) 어떠세요? 지금 구매하시면 5% 추가 할인!');
          suggest.val = Math.round(suggest.val * 0.95);
          updateSelOpts();
        }
      }
    }, 60000);
  }, Math.random() * 20000);
}
