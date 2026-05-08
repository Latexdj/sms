// MTN MoMo Collections API Constants
export const MOMO_BASE_URL = process.env.MOMO_API_URL || "https://sandbox.momodeveloper.mtn.com/collection/v1_0";

// Helper for exponential backoff network retries
async function fetchWithBackoff(url: string, options: any, maxRetries = 3): Promise<any> {
  const baseDelayMs = 1000;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status >= 400 && response.status < 500) {
        // Client errors shouldn't be retried
        throw new Error(`MoMo Client Error: ${response.statusText}`);
      }
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
    
    // Exponential backoff
    const delay = baseDelayMs * Math.pow(2, attempt);
    await new Promise((res) => setTimeout(res, delay));
    attempt++;
  }
}

export async function requestToPay(phone: string, amount: number, reference: string) {
  // Uses Ocp-Apim-Subscription-Key, X-Reference-Id, X-Target-Environment and JWT auth
  const subscriptionKey = process.env.MTN_MOMO_API_KEY || "";
  const token = process.env.MTN_MOMO_TOKEN || ""; // Generated via token endpoint prior
  
  // Clean phone formatting for MoMo standards
  const formattedPhone = phone.replace("+", "");

  const payload = {
    amount: amount.toString(),
    currency: "GHS",
    externalId: reference,
    payer: {
      partyIdType: "MSISDN",
      partyId: formattedPhone
    },
    payerMessage: "SchoolMS Invoice Payment",
    payeeNote: "SchoolMS Payment Received"
  };

  const response = await fetchWithBackoff(`${MOMO_BASE_URL}/requesttopay`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "X-Reference-Id": crypto.randomUUID(), // Unique per transaction request
      "X-Target-Environment": "sandbox", 
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response; // 202 Accepted means payment prompt sent to user
}
