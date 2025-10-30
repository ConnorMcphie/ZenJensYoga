// app/api/admin/gallery-delete/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the Service Role Key to bypass RLS/Storage policies
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const { imageId, storagePath, userId } = await req.json();

    if (!imageId || !storagePath || !userId) {
        return NextResponse.json({ message: 'Missing image ID, path, or user ID' }, { status: 400 });
    }

    try {
        // 1. ADMIN CHECK: Verify the user ID belongs to an admin before using elevated permissions
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('Users')
            .select('is_admin')
            .eq('id', Number(userId))
            .single();

        if (fetchError || !user || !user.is_admin) {
            console.error('Authorization Failed for delete. User ID:', userId);
            return NextResponse.json({ message: 'Authorization Failed: User is not an admin' }, { status: 403 });
        }

        // 2. DB DELETE (Bypasses RLS)
        const { error: dbError } = await supabaseAdmin
            .from('Images')
            .delete()
            .eq('id', imageId);

        if (dbError) {
            console.error('Server DB Delete Error:', dbError);
            return NextResponse.json({ message: 'Database deletion failed' }, { status: 500 });
        }

        // 3. STORAGE DELETE (Bypasses Storage Security)
        const { error: storageError } = await supabaseAdmin.storage
            .from('gallery-photos')
            .remove([storagePath]);

        if (storageError) {
            // Note: We succeeded the DB delete, so we log the storage failure but return success.
            console.warn('Storage deletion failed (DB record removed):', storageError);
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        console.error('Unexpected server error during admin delete:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}