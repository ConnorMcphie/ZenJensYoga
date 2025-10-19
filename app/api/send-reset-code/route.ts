import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabase } from "../../../lib/supabaseClient";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        // Generate a random 6-digit reset code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Insert into Supabase
        const { error: insertError } = await supabase
            .from("password_reset_codes")
            .insert([
                {
                    email,
                    code: resetCode,
                    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
                },
            ]);

        if (insertError) {
            console.error("[SUPABASE ERROR]", insertError);
            return NextResponse.json(
                { message: `Failed to store reset code: ${insertError.message}` },
                { status: 500 }
            );
        }

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Send email with code
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Password Reset Code",
            html: `
        <p>Hello,</p>
        <p>Your password reset code is:</p>
        <h2>${resetCode}</h2>
        <p>This code will expire in 15 minutes.</p>
      `,
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) { // Change any to unknown
        console.error("[SEND RESET CODE ERROR]", error);
        // Type check before accessing message
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        return NextResponse.json(
            { message: errorMessage },
            { status: 500 }
        );
    }
}
