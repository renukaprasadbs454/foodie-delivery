import type { PaymentInitiation } from './types';
import { parseMoney } from '../menu/types';

export type RazorpayCheckoutResult =
  | { status: 'completed_client'; paymentId?: string }
  | { status: 'cancelled' }
  | { status: 'unavailable'; message: string }
  | { status: 'error'; message: string };

type RazorpayOpenOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
};

type RazorpayModule = {
  open: (options: RazorpayOpenOptions) => Promise<{
    razorpay_payment_id?: string;
  }>;
};

/**
 * Open Razorpay Checkout for an initiated order.
 * Native SDK (`react-native-razorpay`) is not a package dependency in this wave —
 * fails closed unless present or harnessed. Client SDK success is never payment truth.
 *
 * Optional harness: EXPO_PUBLIC_RAZORPAY_HARNESS=auto_complete|cancel (dev/tests only).
 */
export async function openRazorpayCheckout(
  initiation: PaymentInitiation,
): Promise<RazorpayCheckoutResult> {
  const harness = process.env.EXPO_PUBLIC_RAZORPAY_HARNESS;
  if (harness === 'auto_complete') {
    return { status: 'completed_client', paymentId: 'harness' };
  }
  if (harness === 'cancel') {
    return { status: 'cancelled' };
  }

  let RazorpayCheckout: RazorpayModule | null = null;
  try {
    // Optional native module — not declared in package.json for this wave.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, global-require
    RazorpayCheckout = require('react-native-razorpay') as RazorpayModule;
  } catch {
    return {
      status: 'unavailable',
      message:
        'Razorpay native SDK is not linked in this build. Initiate succeeded; waiting for server CONFIRMED (webhook).',
    };
  }

  if (typeof RazorpayCheckout?.open !== 'function') {
    return {
      status: 'unavailable',
      message:
        'Razorpay Checkout is not available in this build. Waiting for server confirmation after initiate.',
    };
  }

  try {
    const amountMajor = parseMoney(initiation.amount);
    const amountPaise = Math.round(amountMajor * 100);
    const result = await RazorpayCheckout.open({
      key: initiation.keyId,
      amount: amountPaise,
      currency: initiation.currency || 'INR',
      order_id: initiation.razorpayOrderId,
      name: 'Foodie',
      description: 'Order payment',
    });
    return {
      status: 'completed_client',
      paymentId: result?.razorpay_payment_id,
    };
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'description' in err
        ? String((err as { description?: string }).description)
        : err instanceof Error
          ? err.message
          : String(err ?? '');
    if (
      /cancel/i.test(message) ||
      (err &&
        typeof err === 'object' &&
        'code' in err &&
        Number((err as { code?: number }).code) === 0)
    ) {
      return { status: 'cancelled' };
    }
    return {
      status: 'error',
      message: message || 'Razorpay Checkout failed to open.',
    };
  }
}
