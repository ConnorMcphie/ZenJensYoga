// app/api/admin/gallery-edit/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the Service Role Key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const { imageId, newAlt, userId } = await req.json();

    if (!imageId || !newAlt || !userId) {
        return NextResponse.json({ message: 'Missing image ID, alt text, or user ID' }, { status: 400 });
    }

    try {
        // 1. ADMIN CHECK: Verify the user ID belongs to an admin
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('Users')
            .select('is_admin')
            .eq('id', Number(userId))
            .single();

        if (fetchError || !user || !user.is_admin) {
            console.error('Authorization Failed for edit. User ID:', userId);
            return NextResponse.json({ message: 'Authorization Failed: User is not an admin' }, { status: 403 });
        }

        // 2. DB UPDATE (Bypasses RLS using Service Role Key)
        const { error: dbError } = await supabaseAdmin
            .from('Images')
            .update({ alt_text: newAlt })
            .eq('id', imageId);

        if (dbError) {
            console.error('Server DB Update Error:', dbError);
            return NextResponse.json({ message: 'Database update failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        console.error('Unexpected server error during admin edit:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}