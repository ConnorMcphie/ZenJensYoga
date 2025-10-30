// app/api/admin/gallery-upload/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with the Service Role Key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Helper to extract fields from the incoming FormData request, removing the need
 * for an external 'form-data-parser' module.
 */
async function extractFormData(req: Request) {
    const formData = await req.formData();
    // We explicitly cast the FormDataEntryValue to File or string based on expected field type
    return {
        imageFile: formData.get('image') as File,
        altText: formData.get('altText') as string,
        userId: formData.get('userId') as string,
    };
}

export async function POST(req: Request) {

    // 1. Extract data directly from the request
    const { imageFile, altText, userId } = await extractFormData(req);

    if (!imageFile || !altText || !userId) {
        return NextResponse.json({ message: 'Missing file, alt text, or user ID' }, { status: 400 });
    }

    try {
        // 2. ADMIN CHECK: Verify the user ID belongs to an admin
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('Users')
            .select('is_admin')
            .eq('id', Number(userId))
            .single();

        if (fetchError || !user || !user.is_admin) {
            // This is the CRITICAL security check
            console.error('Admin check failed for user ID:', userId);
            return NextResponse.json({ message: 'Authorization Failed: User is not an admin' }, { status: 403 });
        }

        // 3. FILE UPLOAD (Bypasses RLS using Service Role Key)
        const uniqueFileName = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `public/${uniqueFileName}`;

        // Convert File to Buffer for Supabase upload
        const imageFileBuffer = Buffer.from(await imageFile.arrayBuffer());

        const { error: uploadError } = await supabaseAdmin.storage
            .from('gallery-photos')
            .upload(filePath, imageFileBuffer, {
                contentType: imageFile.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Server Upload Error:', uploadError);
            return NextResponse.json({ message: 'Server-side file upload failed' }, { status: 500 });
        }

        // 4. DB INSERT (Bypasses RLS using Service Role Key)
        const { error: dbError } = await supabaseAdmin
            .from('Images')
            .insert({
                storage_path: filePath,
                alt_text: altText,
            });

        if (dbError) {
            console.error('Server DB Insert Error:', dbError);
            // Clean up the uploaded file if DB insert fails
            await supabaseAdmin.storage.from('gallery-photos').remove([filePath]);
            return NextResponse.json({ message: 'Server-side DB insertion failed' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err) {
        console.error('Unexpected server error during admin upload:', err);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}