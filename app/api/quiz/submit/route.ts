export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, phone, email, answers, matchedShade, source } = body;

    const cleanedPhone = String(phone || "").replace(/[^0-9]/g, "");

    if (!cleanedPhone || cleanedPhone.length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid 10-digit WhatsApp number." },
        { status: 400 }
      );
    }

    const formattedPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    const n8nWebhookUrl =
      process.env.N8N_G6_QUIZ_INTAKE_URL || "https://n8n.cevonne.com/webhook/g6-quiz-intake";

    const payload = {
      event: "QUIZ_COMPLETED",
      customerName: (name || "Beauty Connoisseur").trim(),
      phone: formattedPhone,
      email: (email || "").trim(),
      source: source || "website_quiz",
      answers: answers || {},
      matchedShade: matchedShade || {},
      submittedAt: new Date().toISOString(),
      promoCode: "CEVONNE10",
      vipDiscount: "10% OFF",
    };

    // Forward to n8n G6 webhook with 8s timeout
    let n8nSuccess = false;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const n8nRes = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      n8nSuccess = n8nRes.ok;
    } catch (n8nErr) {
      console.warn("n8n G6 webhook intake warning (non-fatal):", n8nErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your shade match and 10% VIP code have been sent to WhatsApp!",
      matchedShade: matchedShade?.name || "Your Signature Shade",
      n8nDelivered: n8nSuccess,
    });
  } catch (error: any) {
    console.error("Quiz submission error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process quiz submission." },
      { status: 500 }
    );
  }
}

