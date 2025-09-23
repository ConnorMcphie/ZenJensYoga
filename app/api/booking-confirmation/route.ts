// app/api/booking-confirmation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
    // Note: This expects the full class and user details to be passed in the body.
    const { user, classDetails } = await req.json();

    if (!user || !classDetails || !user.email) {
        return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    try {
        const { title, description, date, time, duration } = classDetails;
        const start = new Date(`${date}T${time}`);
        const end = new Date(start.getTime() + duration * 60000);

        const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');

        const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            title
        )}&dates=${formatGoogleDate(start)}/${formatGoogleDate(
            end
        )}&details=${encodeURIComponent(
            `Yoga class: ${description}`
        )}&location=${encodeURIComponent(
            '59 Kew Gardens, Uddingston, G71 6LT'
        )}&ctz=Europe/London`;

        // FIX: Corrected the typo from 'toLocaleDate-string' to 'toLocaleDateString'
        const formattedDate = start.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Ensure these are in your .env.local
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            to: user.email,
            subject: `Booking Confirmation: ${title}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Booking Confirmation</h2>
                    <p>Dear ${user.name || 'Yogi'},</p>
                    <p>Thank you for booking your class with <strong>Zen Jen’s Yoga</strong>. We're excited to welcome you!</p>
                    <h3>Booking Details:</h3>
                    <ul>
                        <li><strong>Class:</strong> ${title}</li>
                        <li><strong>Date:</strong> ${formattedDate}</li>
                        <li><strong>Time:</strong> ${time}</li>
                        <li><strong>Duration:</strong> ${duration} minutes</li>
                    </ul>
                    <p>
                        <a href="${calendarLink}" target="_blank" style="background-color: #2e7d6f; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">
                            Add to Google Calendar
                        </a>
                    </p>
                    <p>If you have any questions, please feel free to reply to this email.</p>
                    <p>We look forward to seeing you on the mat!</p>
                    <p>Warm regards,<br/>The Zen Jen's Yoga Team</p>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Email sending failed:', err);
        return NextResponse.json({ error: 'Email could not be sent' }, { status: 500 });
    }
}