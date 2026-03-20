const PAYTABS_ENDPOINTS: Record<string, string> = {
  ARE: "https://secure.paytabs.com",
  SAU: "https://secure.paytabs.sa",
  EGY: "https://secure-egypt.paytabs.com",
  OMN: "https://secure-oman.paytabs.com",
  JOR: "https://secure-jordan.paytabs.com",
  IRQ: "https://secure-iraq.paytabs.com",
  GLOBAL: "https://secure.paytabs.com",
};

function getBaseUrl(): string {
  const region = (process.env.PAYTABS_REGION || "GLOBAL").toUpperCase();
  return PAYTABS_ENDPOINTS[region] || PAYTABS_ENDPOINTS.GLOBAL;
}

export interface PayTabsCreatePaymentParams {
  cartId: string;
  cartDescription: string;
  amount: number;
  currency?: string;
  callbackUrl: string;
  returnUrl: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface PayTabsPaymentResponse {
  tran_ref: string;
  redirect: string;
  payment_token: string;
}

export interface PayTabsCallbackPayload {
  tran_ref: string;
  cart_id: string;
  cart_amount: string | number;
  tran_currency: string;
  payment_result: {
    response_status: string;
    response_code: string;
    response_message: string;
  };
  payment_info?: {
    payment_method: string;
  };
}

export async function createPayTabsPayment(
  params: PayTabsCreatePaymentParams
): Promise<PayTabsPaymentResponse> {
  const profileId = process.env.PAYTABS_PROFILE_ID;
  const serverKey = process.env.PAYTABS_SERVER_KEY;

  if (!profileId || !serverKey) {
    throw new Error("PayTabs is not configured. Please set PAYTABS_PROFILE_ID and PAYTABS_SERVER_KEY environment variables.");
  }

  const baseUrl = getBaseUrl();

  const body = {
    profile_id: profileId,
    tran_type: "sale",
    tran_class: "ecom",
    cart_id: params.cartId,
    cart_description: params.cartDescription,
    cart_currency: params.currency || "USD",
    cart_amount: params.amount,
    callback: params.callbackUrl,
    return: params.returnUrl,
    customer_details: {
      name: params.customerName || "Customer",
      email: params.customerEmail || "customer@example.com",
      phone: params.customerPhone || "0000000000",
      street1: "N/A",
      city: "Beirut",
      state: "Beirut",
      country: "LB",
      zip: "0000",
    },
  };

  const response = await fetch(`${baseUrl}/payment/request`, {
    method: "POST",
    headers: {
      authorization: serverKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayTabs API error (${response.status}): ${text}`);
  }

  const data = await response.json();

  if (!data.redirect) {
    throw new Error(`PayTabs did not return a redirect URL: ${JSON.stringify(data)}`);
  }

  return {
    tran_ref: data.tran_ref,
    redirect: data.redirect,
    payment_token: data.payment_token,
  };
}

export function isPaymentApproved(payload: PayTabsCallbackPayload): boolean {
  return payload.payment_result?.response_status === "A";
}

export function parseCartId(cartId: string): { userId: number; tierId: number } | null {
  const match = cartId.match(/^plan-(\d+)-user-(\d+)-/);
  if (!match) return null;
  return {
    tierId: parseInt(match[1], 10),
    userId: parseInt(match[2], 10),
  };
}

export function buildCartId(tierId: number, userId: number): string {
  return `plan-${tierId}-user-${userId}-${Date.now()}`;
}
