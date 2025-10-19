// app/api/stripe-webhook/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabaseClient';


type UserInfo = { name?: string | null; email: string };
type ClassInfo = {
    id: number;
    title: string;
    date: string;
    time: string;
    duration: number;
    // Add other needed fields like description
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});

// Helper function to send confirmation email by calling our new API route
async function sendConfirmationEmail(user: UserInfo, classDetails: ClassInfo) {
    try {
        // We need the full site URL to make an internal API call from the server
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        await fetch(`${siteUrl}/api/booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, classDetails }),
        });
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
        // We don't block the process if email fails, just log it.
    }
}

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: unknown) { // Change any to unknown
        const message = err instanceof Error ? err.message : 'Unknown webhook error';
        return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, items } = session.metadata || {};

        if (items && userId) {
            const parsedItems = JSON.parse(items);
            const bookingsToInsert = parsedItems.map((item: { id: number; }) => ({
                classid: Number(item.id),
                userid: Number(userId),
            }));

            if (bookingsToInsert.length > 0) {
                // 1. Create the bookings in the database
                const { error } = await supabase // Removed 'data: newBookings,'
                    .from('Bookings')
                    .insert(bookingsToInsert);

                if (error) {
                    console.error('Error creating bookings:', error);
                    return new NextResponse('Failed to create bookings.', { status: 500 });
                }

                // 2. Fetch user and class details for the confirmation emails
                try {
                    const { data: userData } = await supabase
                        .from('Users')
                        .select('name, email')
                        .eq('id', userId)
                        .single();

                    const classIds = parsedItems.map((item: { id: number; }) => Number(item.id));
                    const { data: classesData } = await supabase
                        .from('classes')
                        .select('*')
                        .in('id', classIds);

                    // 3. Send a confirmation email for each class booked
                    if (userData && classesData) {
                        for (const classDetail of classesData) {
                            await sendConfirmationEmail(userData, classDetail);
                        }
                    }
                } catch (e) {
                    console.error("Error fetching data for confirmation email:", e);
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}