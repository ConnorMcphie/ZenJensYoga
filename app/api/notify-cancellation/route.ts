// app/api/notify-cancellation/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Define types for clarity
type User = {
    name: string | null;
    email: string | null;
};



// A more accurate type for the actual data structure being returned in this specific query
type BookingWithUsersArray = {
    Users: User[] | null;
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const { classId } = await req.json();
    if (!classId) {
        return NextResponse.json({ error: 'Missing classId' }, { status: 400 });
    }

    try {
        const { data: classData, error: classErr } = await supabase
            .from('classes')
            .select('title, date')
            .eq('id', classId)
            .single();

        if (classErr || !classData) {
            console.error('Error fetching class:', classErr);
            return NextResponse.json({ error: 'Error fetching class info' }, { status: 500 });
        }

        const { data: bookings, error: bookingErr } = await supabase
            .from('Bookings')
            .select('Users ( name, email )')
            .eq('classid', classId);

        if (bookingErr) {
            console.error('Error fetching bookings:', bookingErr);
            return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // FIX: Cast to 'unknown' then to the correct array-based type
        for (const booking of (bookings as unknown as BookingWithUsersArray[]) || []) {
            if (booking.Users && booking.Users.length > 0) {
                const user = booking.Users[0]; // Safely access the first user
                if (!user || !user.email) continue;

                try {
                    await transporter.sendMail({
                        from: `"Zen Jen's Yoga" <${process.env.EMAIL_USER}>`,
                        to: user.email,
                        subject: `Class Cancellation: ${classData.title}`,
                        html: `
                            <p>Dear ${user.name || 'Yogi'},</p>
                            <p>We regret to inform you that the class <strong>${classData.title}</strong> has been cancelled.</p>
                            <p>Thank you for your understanding,<br/>Zen Jen's Yoga</p>
                        `,
                    });
                } catch (emailErr) {
                    console.error(`Failed to send email to ${user.email}:`, emailErr);
                }
            }
        }

        return NextResponse.json({ success: true, sent: bookings?.length || 0 });
    } catch (err) {
        console.error('Unexpected server error:', err);
        return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
    }
}