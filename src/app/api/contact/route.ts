import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";
import { z } from "zod";
import { checkRateLimit } from "@/lib/ratelimit";

// POST /api/contact — Send contact form message to admin via Brevo
// Sends an email to the admin (GMAIL_USER or EMAIL_FROM address)
// with the contact form details.

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(500),
  topic: z.string().max(100).default("General Inquiry"),
  message: z.string().min(1).max(5000),
});

let _brevo: BrevoClient | null = null;
function getBrevo(): BrevoClient | null {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;
  if (!_brevo) _brevo = new BrevoClient({ apiKey });
  return _brevo;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: Request) {
  try {
    // Rate limiting: 3 contact form submissions per minute per IP
    const { success } = await checkRateLimit(req, "contact");
    if (!success) {
      return NextResponse.json(
        { error: "Too many messages. Please wait a moment before sending again." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const parseResult = contactSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid form data",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, topic, message } = parseResult.data;

    // Determine admin email — send to the GMAIL_USER or EMAIL_FROM address
    const rawFrom = process.env.EMAIL_FROM || process.env.GMAIL_USER || "hello@tarewellness.com";
    const adminEmail = rawFrom.match(/<([^>]+)>/)?.[1] || rawFrom;

    const brevo = getBrevo();

    if (!brevo) {
      // No Brevo configured — log to console (dev fallback)
      console.log("📧 [DEV] Contact form submission — BREVO_API_KEY not set.");
      console.log(`   From: ${name} <${email}>`);
      console.log(`   Topic: ${topic}`);
      console.log(`   Message: ${message.substring(0, 200)}...`);
      return NextResponse.json({
        success: true,
        message: "Message logged to console (no email provider configured)",
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeTopic = escapeHtml(topic);
    const safeMessage = escapeHtml(message);

    const html = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FFF5EE; padding: 40px 20px;">
        <div style="background: white; border-radius: 24px; padding: 40px;">
          <h1 style="font-family: 'Fraunces', serif; color: #4E0030; font-size: 24px; margin-bottom: 16px;">
            New Contact Form Submission
          </h1>
          <div style="margin-bottom: 16px;">
            <p style="color: #4E0030; opacity: 0.7; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Name</p>
            <p style="color: #4E0030; font-size: 16px; font-weight: bold; margin: 0;">${safeName}</p>
          </div>
          <div style="margin-bottom: 16px;">
            <p style="color: #4E0030; opacity: 0.7; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Email</p>
            <p style="color: #4E0030; font-size: 16px; font-weight: bold; margin: 0;">${safeEmail}</p>
          </div>
          <div style="margin-bottom: 16px;">
            <p style="color: #4E0030; opacity: 0.7; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0;">Topic</p>
            <p style="color: #4E0030; font-size: 16px; font-weight: bold; margin: 0;">${safeTopic}</p>
          </div>
          <div style="margin-bottom: 24px;">
            <p style="color: #4E0030; opacity: 0.7; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">Message</p>
            <div style="background: #FFF5EE; border-radius: 12px; padding: 16px; color: #4E0030; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</div>
          </div>
          <a href="mailto:${safeEmail}" style="display: inline-block; background: #F10897; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Reply to ${safeName}
          </a>
        </div>
        <p style="text-align: center; color: #4E0030; opacity: 0.5; font-size: 12px; margin-top: 24px;">
          © 2026 Tare Wellness Enterprise Ltd. All rights reserved.
        </p>
      </div>
    `;

    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: "Tare Wellness Contact", email: "hello@tarewellness.com" },
      to: [{ email: adminEmail, name: "Tare Wellness Admin" }],
      replyTo: { email, name },
      subject: `[Contact] ${topic} — from ${name}`,
      htmlContent: html,
      tags: ["contact-form", "admin"],
    });

    return NextResponse.json({
      success: true,
      message: "Message sent to our team",
      emailId: response?.messageId ?? null,
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
