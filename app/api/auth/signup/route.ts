// File: app/api/auth/signup/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabaseClient'; // Adjust path if needed

export async function POST(req: Request) {
    try {
        // 1. Get data from request body
        const { fullName, phone, email, password } = await req.json();

        // 2. Validate input
        if (!fullName || !email || !password) {
            // Send JSON error response
            return NextResponse.json({ message: 'Missing required fields (Full Name, Email, Password)' }, { status: 400 });
        }
        if (password.length < 6) {
            // Send JSON error response
            return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // 3. Check if user already exists
        const { data: existingUser, error: checkError } = await supabase
            .from('Users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        // Handle potential DB error during check
        if (checkError) {
            console.error('Supabase check error:', checkError);
            // Send JSON error response
            return NextResponse.json({ message: 'Database error checking user existence.' }, { status: 500 });
        }

        if (existingUser) {
            // Send JSON error response for duplicate user
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 }); // 409 Conflict is suitable here
        }

        // 4. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Insert the new user into the database
        const { data: newUser, error: insertError } = await supabase
            .from('Users')
            .insert({
                name: fullName,
                phone: phone || null, // Ensure phone is null if empty, adjust if DB requires it differently
                email: email,
                password: hashedPassword,
                is_admin: false
            })
            .select('id, name, email, phone, is_admin')
            .single();

        // Handle potential DB error during insert
        if (insertError) {
            console.error('Supabase insert error:', insertError);
            // Send JSON error response
            return NextResponse.json({ message: 'Failed to create user account.' }, { status: 500 });
        }

        if (!newUser) {
            // Should ideally not happen if insertError is null, but good practice
            console.error('User creation did not return expected data.');
            return NextResponse.json({ message: 'User creation failed unexpectedly.' }, { status: 500 });
        }

        // 6. Return success JSON response with new user data
        return NextResponse.json(newUser, { status: 201 }); // 201 Created

    } catch (error: unknown) {
        console.error('[SIGNUP API CATCH BLOCK ERROR]', error); // Log any unexpected errors
        const message = error instanceof Error ? error.message : 'An internal server error occurred.';
        // Send JSON error response for unexpected errors
        return NextResponse.json({ message: message }, { status: 500 });
    }
}