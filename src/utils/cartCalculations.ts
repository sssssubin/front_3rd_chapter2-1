import { Product, CartItem } from '../types';
import {
  DISCOUNT_RATES,
  BULK_DISCOUNT_THRESHOLD,
  BULK_DISCOUNT_RATE,
  TUESDAY_DISCOUNT_RATE,
  POINT_RATE,
} from '../constants';
import { dateUtils } from '../utils/dateUtils';

export function calculateCart(items: CartItem[], products: Product[], date: Date = new Date()) {
  let totalAmount = 0;
  let totalItemCount = 0;
  let subTotal = 0;

  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;

    const productTotalPrice = product.price * item.quantity;
    totalItemCount += item.quantity;
    subTotal += productTotalPrice;

    const discount = item.quantity >= 10 ? DISCOUNT_RATES[product.id] || 0 : 0;
    totalAmount += productTotalPrice * (1 - discount);
  });

  let currentDiscountRate = 0;

  if (totalItemCount >= BULK_DISCOUNT_THRESHOLD) {
    const bulkDisc = totalAmount * BULK_DISCOUNT_RATE;
    const itemDisc = subTotal - totalAmount;
    if (bulkDisc > itemDisc) {
      totalAmount = subTotal * (1 - BULK_DISCOUNT_RATE);
      currentDiscountRate = BULK_DISCOUNT_RATE;
    } else {
      currentDiscountRate = (subTotal - totalAmount) / subTotal;
    }
  } else {
    currentDiscountRate = (subTotal - totalAmount) / subTotal;
  }

  if (dateUtils.getDay() === 2) {
    // 2는 화요일
    totalAmount *= 1 - TUESDAY_DISCOUNT_RATE;
    currentDiscountRate = TUESDAY_DISCOUNT_RATE;
  }

  const loyaltyPoints = Math.floor(totalAmount / POINT_RATE);

  return { totalAmount, totalItemCount, currentDiscountRate, loyaltyPoints };
}
