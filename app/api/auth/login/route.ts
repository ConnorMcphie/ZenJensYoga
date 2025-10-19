// File: app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '../../../../lib/supabaseClient'; // Adjust path if needed

// Define the POST handler function
export async function POST(req: Request) {
    try {
        // 1. Get email and password from request body
        const { email, password } = await req.json();

        // 2. Validate input
        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }

        // 3. Find the user in the database by email
        const { data: user, error: fetchError } = await supabase
            .from('Users') // Make sure 'Users' matches your table name
            .select('*') // Select all needed fields, including the hashed password
            .eq('email', email)
            .maybeSingle(); // Use maybeSingle() in case user doesn't exist

        // Handle database error during fetch
        if (fetchError) {
            console.error('Supabase fetch user error:', fetchError);
            return NextResponse.json({ message: 'Database error during login' }, { status: 500 });
        }

        // 4. If user not found, return error
        if (!user) {
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }); // 401 Unauthorized
        }

        // 5. Compare the provided password with the stored hashed password
        const isValidPassword = await bcrypt.compare(password, user.password);

        // 6. If passwords don't match, return error
        if (!isValidPassword) {
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 }); // 401 Unauthorized
        }

        // 7. Login successful - return user data (excluding password)
        // IMPORTANT: Never send the password hash back to the client!
        const { password: _, ...userData } = user; // Destructure to remove password

        return NextResponse.json(userData, { status: 200 }); // 200 OK

    } catch (error: unknown) {
        console.error('[LOGIN API CATCH BLOCK ERROR]', error);
        const message = error instanceof Error ? error.message : 'An internal server error occurred during login.';
        return NextResponse.json({ message: message }, { status: 500 });
    }
}

// Optional: Add handlers for other methods if needed, or a default handler
// export async function GET(req: Request) {
//     return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
// }
// Add similar handlers for PUT, DELETE, etc., or they will default to 405