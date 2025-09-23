import { NextResponse } from "next/server";
import Stripe from "stripe";

// Check if the environment variable is loaded. This will log on server start.
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("CRITICAL ERROR: STRIPE_SECRET_KEY is not defined.");
  console.error("Please ensure you have a .env.local file with STRIPE_SECRET_KEY=... and have restarted the server.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-08-27.basil",
});

export async function POST(req: Request) {
  // 1. Log the incoming request to see what the server is receiving.
  let requestBody;
  try {
    requestBody = await req.json();
    console.log("Received checkout request:", JSON.stringify(requestBody, null, 2));
  } catch (error) {
    console.error("Could not parse request body:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { items, userId } = requestBody;

  // 2. Add improved data validation.
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  for (const item of items) {
    if (typeof item.price !== 'number' || item.price < 0 || isNaN(item.price)) {
      console.error("Validation Error: Invalid item in cart.", { userId, item });
      return NextResponse.json(
          { error: `Invalid item detected: ${item.title || 'Unknown Item'} has an invalid price.` },
          { status: 400 }
      );
    }
  }

  // 3. Wrap the Stripe call in a more specific try/catch block.
  try {
    console.log("Attempting to create Stripe session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: items.map((item: any) => ({
        price_data: {
          currency: "gbp",
          product_data: { name: item.title },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: 1,
      })),
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout?canceled=true`,
      metadata: {
        userId: userId?.toString() || "guest",
        items: JSON.stringify(items.map((item: { id: any; }) => ({ id: item.id }))),
      },
    });

    console.log("Stripe session created successfully:", session.id);
    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    // 4. Log the DETAILED error from Stripe. This is the most important part.
    console.error("--- STRIPE API ERROR ---");
    console.error(err);
    console.error("--- END STRIPE API ERROR ---");

    // Return a more informative error to the client.
    return NextResponse.json(
        { error: "Failed to create checkout session.", details: err.message },
        { status: 500 }
    );
  }
}