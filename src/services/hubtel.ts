export const HUBTEL_API_URL = "https://smsc.hubtel.com/v1/messages/send";

/**
 * Hubtel API SMS sender payload natively dispatching generic HTTP POST
 * Defaults resolving environment vars internally.
 */
export async function sendSMS(to: string, content: string, senderId?: string): Promise<boolean> {
  const clientId = process.env.HUBTEL_CLIENT_ID || "";
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET || "";
  
  // Sender IDs legally must not exceed 11 characters or numeric arrays natively according to Ghana Telecom specs.
  const parsedSenderId = senderId ? senderId.substring(0, 11).replace(/[^a-zA-Z0-9 ]/g, "") : "SchoolMS";

  // Clean formatting extracting strict phone numbers natively. E.g +233...
  const formattedPhone = to.replace("+", "").replace(" ", "");

  const params = new URLSearchParams({
    clientid: clientId,
    clientsecret: clientSecret,
    from: parsedSenderId,
    to: formattedPhone,
    content: content,
  });

  try {
    const response = await fetch(`${HUBTEL_API_URL}?${params.toString()}`, {
      method: "POST",
    });

    if (response.ok) {
      return true; // Sent reliably onto Telecom array matrix
    }

    // Log the Hubtel response error generically for system debugging
    const errorBody = await response.text();
    console.warn(`Hubtel HTTP Transmission Failed to ${formattedPhone}:`, errorBody);
    return false;
  } catch (error) {
    console.error(`Fatal Hubtel Timeout/Network Exception for ${formattedPhone}:`, error);
    return false;
  }
}
