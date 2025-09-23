import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    const { name, email, title, description, date, time, duration } = await req.json();

    try {
        const start = new Date(`${date}T${time}`);
        const end = new Date(start.getTime() + duration * 60000);

        const formatGoogleDate = (d: Date) =>
            d.toISOString().replace(/[-:]|\.\d{3}/g, '');

        const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            title
        )}&dates=${formatGoogleDate(start)}/${formatGoogleDate(
            end
        )}&details=${encodeURIComponent(
            description
        )}&location=${encodeURIComponent(
            '59 Kew Gardens, Uddingston, G71 6LT'
        )}&ctz=Europe/London`;

        const formattedDate = start.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.CONTACT_EMAIL,
                pass: process.env.CONTACT_EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            to: email,
            subject: `Booking Confirmation: ${title}`,
            html: `
                <p>Dear ${name},</p>

                <p>Thank you for booking your class with <strong>Zen Jens Yoga</strong>. We're excited to welcome you!</p>

                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li><strong>Class:</strong> ${title}</li>
                    <li><strong>Date:</strong> ${formattedDate}</li>
                    <li><strong>Time:</strong> ${time}</li>
                    <li><strong>Duration:</strong> ${duration} minutes</li>
                </ul>

                <p>${description}</p>

                <p>You can add this class to your Google Calendar using the link below:</p>
                <p>
                    <a href="${calendarLink}" target="_blank" style="color: #2e7d6f; text-decoration: underline;">
                        ➤ Add to Google Calendar
                    </a>
                </p>

                <p>If you have any questions or need to reschedule, please feel free to reply to this email.</p>

                <p>We look forward to seeing you soon on the mat.</p>

                <p>Warm regards,<br/>
                Zen Jens Yoga<br/>
                <a href="mailto:${process.env.CONTACT_EMAIL}">${process.env.CONTACT_EMAIL}</a>
                </p>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Email sending failed:', err);
        return NextResponse.json({ error: 'Email could not be sent' }, { status: 500 });
    }
}
