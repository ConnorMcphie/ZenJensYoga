import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
});

export async function POST(req: Request) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, items } = session.metadata || {};

        if (items && userId) {
            const parsedItems = JSON.parse(items);
            const bookingsToInsert = parsedItems.map((item: { id: any; }) => ({
                classid: Number(item.id),
                userid: Number(userId),
            }));

            if (bookingsToInsert.length > 0) {
                const { error } = await supabase.from('Bookings').insert(bookingsToInsert);

                if (error) {
                    console.error('Error creating bookings:', error);
                    // Even if DB fails, Stripe payment is complete, so return 200
                    // You might want to add more robust error handling here,
                    // like sending an alert to yourself.
                } else {
                    console.log(`Successfully created ${bookingsToInsert.length} bookings for user ${userId}.`);
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}