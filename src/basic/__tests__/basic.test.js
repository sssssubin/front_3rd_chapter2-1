import {
  beforeAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { dateUtils } from '../main.basic.js';

// 특정 요일(화요일)로 시스템 날짜를 고정하는 함수
function setupTuesdayTest() {
  const mockDate = new Date('2024-10-15'); // 화요일
  vi.useFakeTimers();
  vi.setSystemTime(mockDate);

  // getCurrentDate 함수를 모킹
  dateUtils.setCurrentDate(mockDate);

  // // 현재 날짜 확인
  const currentDate = dateUtils.getCurrentDate();
  console.log('테스트에서 설정된 날짜:', currentDate);
}

// 실제 타이머를 복원하는 함수
function restoreRealTimers() {
  vi.useRealTimers();
}

describe('basic test', () => {
  describe.each([
    { type: 'origin', loadFile: () => import('../../main.js'), skip: true },
    { type: 'basic', loadFile: () => import('../main.basic.js') },
  ])('$type 장바구니 시나리오 테스트', ({ loadFile, skip, type }) => {
    const testFn = skip ? describe.skip : describe;

    testFn(`${type} 테스트`, () => {
      let sel, addBtn, cartDisp, sum, salePrice, stockInfo;
      let mainModule;

      beforeAll(async () => {
        // DOM 초기화
        document.body.innerHTML = '<div id="app"></div>';
        console.log('초기 DOM:', document.body.innerHTML);

        // 모듈 로드
        mainModule = await loadFile();

        // main 함수 실행 (DOM 요소 생성)
        if (typeof mainModule.main === 'function') {
          mainModule.main();
        } else {
          console.error('main 함수를 찾을 수 없습니다.');
          console.log('mainModule 내용:', mainModule);
        }

        console.log('main 함수 실행 후 DOM:', document.body.innerHTML);

        // 전역 변수 참조
        sel = document.getElementById('product-select');
        addBtn = document.getElementById('add-to-cart');
        cartDisp = document.getElementById('cart-items');
        sum = document.getElementById('cart-total');
        salePrice = document.getElementById('sale-rate');
        stockInfo = document.getElementById('stock-status');

        if (!sel || !addBtn || !cartDisp || !sum || !salePrice || !stockInfo) {
          console.error('일부 DOM 요소를 찾을 수 없습니다.');
          console.log('현재 DOM 상태:', document.body.innerHTML);
        }
      });

      beforeEach(() => {
        setupTuesdayTest();

        vi.spyOn(window, 'alert').mockImplementation(() => {});
      });

      afterEach(() => {
        restoreRealTimers();

        vi.restoreAllMocks();
      });

      it('초기 상태: 상품 목록이 올바르게 그려졌는지 확인', () => {
        expect(sel).toBeDefined();
        expect(sel.tagName.toLowerCase()).toBe('select');
        expect(sel.children.length).toBe(5);

        // 첫 번째 상품 확인
        expect(sel.children[0].value).toBe('p1');
        expect(sel.children[0].textContent).toBe('상품1 - 10000원');
        expect(sel.children[0].disabled).toBe(false);

        // 마지막 상품 확인
        expect(sel.children[4].value).toBe('p5');
        expect(sel.children[4].textContent).toBe('상품5 - 25000원');
        expect(sel.children[4].disabled).toBe(false);

        // 재고 없는 상품 확인 (상품4)
        expect(sel.children[3].value).toBe('p4');
        expect(sel.children[3].textContent).toBe('상품4 - 15000원');
        expect(sel.children[3].disabled).toBe(true);
      });

      it('초기 상태: DOM 요소가 올바르게 생성되었는지 확인', () => {
        expect(document.querySelector('h1').textContent).toBe('장바구니');
        expect(sel).toBeDefined();
        expect(addBtn).toBeDefined();
        expect(cartDisp).toBeDefined();
        expect(sum).toBeDefined();
        expect(stockInfo).toBeDefined();
      });

      it('상품을 장바구니에 추가할 수 있는지 확인', () => {
        sel.value = 'p1';
        addBtn.click();
        expect(cartDisp.children.length).toBe(1);
        expect(
          cartDisp.children[0].querySelector('span').textContent,
        ).toContain('상품1 - 10000원 x 1');
      });

      it('장바구니에서 상품 수량을 변경할 수 있는지 확인', () => {
        const increaseBtn = cartDisp.querySelector(
          '.quantity-change[data-change="1"]',
        );
        increaseBtn.click();
        expect(
          cartDisp.children[0].querySelector('span').textContent,
        ).toContain('상품1 - 10000원 x 2');
      });

      it('장바구니에서 상품을 삭제할 수 있는지 확인', () => {
        sel.value = 'p1';
        addBtn.click();
        const removeBtn = cartDisp.querySelector('.remove-item');
        removeBtn.click();
        expect(cartDisp.children.length).toBe(0);
      });

      it('총액이 올바르게 계산되는지 확인', () => {
        sel.value = 'p1';
        addBtn.click();
        addBtn.click();
        expect(sum.textContent).toContain('총액: 18000원');
      });

      it('할인이 올바르게 적용되는지 확인', () => {
        sel.value = 'p1';
        for (let i = 0; i < 10; i++) {
          addBtn.click();
        }
        expect(sum.textContent).toContain(
          '총액: 87480원(19.0% 할인 적용)(포인트: 87)',
        );
      });

      it('포인트가 올바르게 계산되는지 확인', () => {
        sel.value = 'p2';
        addBtn.click();
        expect(document.getElementById('loyalty-points').textContent).toContain(
          '(포인트: 103)',
        );
      });

      it('번개세일 기능이 정상적으로 동작하는지 확인', () => {
        // 일부러 랜덤이 가득한 기능을 넣어서 테스트 하기를 어렵게 만들었습니다. 이런 코드는 어떻게 하면 좋을지 한번 고민해보세요!
      });

      it('추천 상품 알림이 표시되는지 확인', () => {
        // 일부러 랜덤이 가득한 기능을 넣어서 테스트 하기를 어렵게 만들었습니다. 이런 코드는 어떻게 하면 좋을지 한번 고민해보세요!
      });

      it('화요일 할인이 적용되는지 확인', () => {
        sel.value = 'p1';
        addBtn.click();
        expect(
          document.getElementById('discount-display').textContent,
        ).toContain('(19.0% 할인 적용)');
      });

      it('재고가 부족한 경우 추가되지 않는지 확인', () => {
        // p4 상품 선택 (재고 없음)
        sel.value = 'p4';
        addBtn.click();

        // p4 상품이 장바구니에 없는지 확인
        const p4InCart = Array.from(cartDisp.children).some(
          (item) => item.id === 'p4',
        );
        expect(p4InCart).toBe(false);
        expect(stockInfo.textContent).toContain('상품4: 품절');
      });

      it('재고가 부족한 경우 추가되지 않고 알림이 표시되는지 확인', () => {
        sel.value = 'p5';
        addBtn.click();

        // p5 상품이 장바구니에 추가되었는지 확인
        const p5InCart = Array.from(cartDisp.children).some(
          (item) => item.id === 'p5',
        );
        expect(p5InCart).toBe(true);

        // 수량 증가 버튼 찾기
        const increaseBtn = cartDisp.querySelector(
          '#p5 .quantity-change[data-change="1"]',
        );
        expect(increaseBtn).not.toBeNull();

        // 수량을 10번 증가시키기
        for (let i = 0; i < 10; i++) {
          increaseBtn.click();
        }

        // 11번째 클릭 시 재고 부족 알림이 표시되어야 함
        increaseBtn.click();

        // 재고 부족 알림이 표시되었는지 확인
        expect(window.alert).toHaveBeenCalledWith(
          expect.stringContaining('재고가 부족합니다'),
        );

        // 장바구니의 상품 수량이 10개인지 확인
        const itemQuantity = cartDisp.querySelector('#p5 span').textContent;
        expect(itemQuantity).toContain('x 10');

        // 재고 상태 정보에 해당 상품이 재고 부족으로 표시되는지 확인
        expect(stockInfo.textContent).toContain('상품5: 품절');
      });
    });
  });
});
