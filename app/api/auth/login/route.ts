import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the SERVICE ROLE key to bypass RLS.
// This allows us to select the user's password hash securely on the server.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        // 1. Get email and password from request body
        const { email, password } = await req.json();

        // 2. Validate input
        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }

        // 3. Find the user in the database by email (using admin client)
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('Users')
            .select('*') // Selects password hash and admin status
            .eq('email', email)
            .maybeSingle();

        // Handle database error during fetch
        if (fetchError) {
            console.error('Supabase fetch user error:', fetchError);
            return NextResponse.json({ message: 'Database error during login' }, { status: 500 });
        }

        // 4. If user not found, return error
        if (!user) {
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }

        // 5. Compare the provided password with the stored hashed password
        const isValidPassword = await bcrypt.compare(password, user.password);

        // 6. If passwords don't match, return error
        if (!isValidPassword) {
            return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
        }

        // 7. Login successful - return user data (excluding password)
        const { password: _, ...userData } = user;

        return NextResponse.json(userData, { status: 200 });

    } catch (error: unknown) {
        console.error('[LOGIN API CATCH BLOCK ERROR]', error);
        const message = error instanceof Error ? error.message : 'An internal server error occurred during login.';
        return NextResponse.json({ message: message }, { status: 500 });
    }
}