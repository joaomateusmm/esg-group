import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { auth } from "@/lib/auth";

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Initialize Stripe
const stripeSecret = process.env.STRIPE_SECRET_KEY;

// Fixed shipping cost (This might need currency adjustment in a real multi-currency scenario)
const FIXED_SHIPPING_COST = 1500;

export async function POST(req: Request) {
  try {
    // 1. Stripe Key Validation
    if (!stripeSecret) {
      console.error(
        "❌ STRIPE_SECRET_KEY not defined in environment variables.",
      );
      return NextResponse.json(
        { error: "Server configuration error (Stripe Key Missing)" },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia" as unknown as Stripe.LatestApiVersion,
      typescript: true,
    });

    // 2. Read Body
    const body = await req.json();
    const { items, currency, shippingAddress } = body; // Retrieve currency from body

    // Log for debugging
    console.log(
      "📦 Payment Intent Started. Currency:",
      currency,
      "Address received:",
      !!shippingAddress,
    );

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    // Calculate item subtotal
    const itemsTotal = items.reduce(
      (acc: number, item: Item) => acc + item.price * item.quantity,
      0,
    );

    // Add shipping to total
    const totalAmount = itemsTotal + FIXED_SHIPPING_COST;

    // Minify items for metadata
    const itemsMinified = items.map((i: Item) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      image: i.image,
    }));

    // 3. Safe Address Sanitization
    const rawAddress = shippingAddress || {};

    const sanitizedAddress = {
      street: rawAddress.street || "Not provided",
      number: rawAddress.number || "N/A",
      complement: rawAddress.complement || "",
      city: rawAddress.city || "",
      state: rawAddress.state || "",
      zipCode: rawAddress.zipCode || "",
      country: rawAddress.country || "BR",
    };

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency || "brl", // Use passed currency or default to BRL
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: session.user.id,
        itemsJson: JSON.stringify(itemsMinified).substring(0, 499),
        shippingAddressJson: JSON.stringify(sanitizedAddress),
        shippingCost: FIXED_SHIPPING_COST.toString(),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("❌ CRITICAL Error creating Payment Intent:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Error processing payment: ${errorMessage}` },
      { status: 500 },
    );
  }
}
