export const PAYSTACK_BASE_URL = "https://api.paystack.co";

export async function initializeTransaction(email: string, amount: number, reference: string, callback_url: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  
  // Paystack expects amount in tightly packed subunit (e.g. kobo or pesewas)
  const amountInSubunit = Math.round(amount * 100);

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountInSubunit,
      reference,
      callback_url,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Paystack Initialization failed: ${errorData.message}`);
  }

  return response.json();
}

export async function verifyTransaction(reference: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY || "";

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Paystack Verification failed for ref: ${reference}`);
  }

  return response.json();
}
