import { tenantPrisma } from "@/lib/prisma";
import { sendSMS as hubtelSend } from "./hubtel";

const SMS_UNIT_COST = 0.0400; // Native Local GHS rate projection

/**
 * Higher level SDK wrapping generic Hubtel engine adding atomic Credit Deductions 
 * and persistent SMS Log accounting generation.
 */
export async function sendSingle(schoolId: string, phone: string, message: string): Promise<boolean> {
  const db = tenantPrisma(schoolId);
  
  // 1. Validate if School contains sufficient bound thresholds
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { sms_credits: true, name: true }
  });

  if (!school || school.sms_credits <= 0) {
    console.warn(`[SMS_BLOCKED] Insufficient Credits. School: ${schoolId}`);
    return false;
  }

  // 2. Transmit via Telcos
  const isSent = await hubtelSend(phone, message, school.name);

  // 3. Atomically reconcile database Ledgers and Log outputs securely
  if (isSent) {
    await db.$transaction([
      db.school.update({
        where: { id: schoolId },
        data: { sms_credits: { decrement: 1 } }
      }),
      db.smsLog.create({
        data: {
          school_id: schoolId,
          recipient_phone: phone,
          message: message,
          status: "SENT",
          cost: SMS_UNIT_COST
        }
      })
    ]);
    return true;
  } else {
    // Record FAILED message without executing credit decrement
    await db.smsLog.create({
      data: {
         school_id: schoolId,
         recipient_phone: phone,
         message: message,
         status: "FAILED",
         cost: 0.0000
      }
    });
    return false;
  }
}

/**
 * Mass broadcast loop wrapping sendSingle natively arrays securely limiting network failures.
 */
export async function sendBulk(schoolId: string, recipients: string[], message: string) {
  let successful = 0;
  
  for (const phone of recipients) {
    // Await natively resolving race conditions safely on credit limits inside sequential atomic boundaries
    const ok = await sendSingle(schoolId, phone, message);
    if (ok) successful++;
  }

  return { attempted: recipients.length, successful };
}
