import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, status, eventTitle, discordUsername } = await req.json();

    if (!email || !status || !eventTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isApproved = status === "approved";
    const subject = isApproved 
      ? `✅ Registration Approved: ${eventTitle}` 
      : `❌ Registration Update: ${eventTitle}`;

    const htmlContent = `
      <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
        <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'};">
          ${isApproved ? 'Registration Approved!' : 'Registration Update'}
        </h2>
        <p>Hello <strong>${discordUsername || 'Participant'}</strong>,</p>
        <p>Your registration for the event <strong>${eventTitle}</strong> has been <strong>${status}</strong>.</p>
        
        ${isApproved ? `
          <p>We look forward to seeing you there! Make sure to keep an eye on the Discord server for any further announcements.</p>
        ` : `
          <p>Unfortunately, we cannot accommodate your registration at this time. This may be due to the event reaching full capacity or not meeting the requirements.</p>
          <p>Stay tuned for our upcoming events!</p>
        `}
        
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">This is an automated message from La Dolce Vita Community.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "La Dolce Vita <noreply@ldvarch.com>",
      to: [email],
      subject,
      html: htmlContent,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
