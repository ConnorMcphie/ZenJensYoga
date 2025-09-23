import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    const { name, email, message } = await req.json();

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.CONTACT_EMAIL,
            pass: process.env.CONTACT_EMAIL_PASSWORD,
        },
    });

    try {
        await transporter.sendMail({
            from: `"${name}" <${email}>`,
            to: process.env.CONTACT_EMAIL,
            subject: `New message from ${name}`,
            text: message,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error sending email:', err);
        return NextResponse.json({ error: 'Email failed to send' }, { status: 500 });
    }
}
