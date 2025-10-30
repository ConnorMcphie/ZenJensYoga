// connormcphie/zenjensyoga/ZenJensYoga-9a83938d95e017890a9b21ab8e7ae1f772fd085a/app/gallery/page.tsx
'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from '../../lib/supabaseClient'; // Import Supabase client
import toast from "react-hot-toast"; // Use toast for notifications


// Define types for clarity
type ImageItem = {
    id: number; // Added to enable editing/deleting
    src: string; // This will hold the full public URL from Supabase Storage
    alt: string;
    storage_path: string; // The path used to retrieve the public URL
};
type SelectedImage = ImageItem | null;

type AdminUser = {
    id: number;
    email: string;
    is_admin: boolean;
    // ... other admin fields
};

// --- Modal Component (Embedded for simplicity) ---
function ImageModal({ image, onClose }: { image: ImageItem; onClose: () => void; }) {
    return (
        // Overlay (with backdrop blur and click-to-close)
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
            onClick={onClose}
        >
            {/* Modal Content container: uses max-w-fit to shrink-wrap the image content */}
            <div
                className="relative max-w-fit max-h-full cursor-default"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Image and Gradient/Caption Container (now the visible container) */}
                <div className="relative w-full rounded-lg shadow-2xl overflow-hidden">

                    {/* Close Button: plain white cross */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white text-2xl z-50 transition-opacity hover:opacity-70"
                        aria-label="Close modal"
                    >
                        &times;
                    </button>

                    {/* The image is displayed responsively inside the modal */}
                    <Image
                        src={image.src}
                        alt={image.alt}
                        width={1200}
                        height={1200}
                        // max-h-[85vh] keeps the image from stretching off the screen
                        className="w-full h-auto max-w-full max-h-[85vh] object-contain bg-white"
                    />

                    {/* Gradient Overlay and Caption (positioned over the bottom of the image) */}
                    <div className="absolute inset-x-0 bottom-0 pt-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                        {/* Alt Text Caption */}
                        <div className="p-4 text-white text-center">
                            <p className="text-sm md:text-base pointer-events-auto">{image.alt}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- Image Card Component (to include edit/delete buttons) ---
function ImageCard({ img, isAdmin, onImageClick, onDelete, onEdit }: {
    img: ImageItem;
    isAdmin: boolean;
    onImageClick: (image: ImageItem) => void;
    onDelete: (image: ImageItem) => Promise<void>;
    onEdit: (id: number, newAlt: string) => Promise<void>;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentAlt, setCurrentAlt] = useState(img.alt);
    const [editLoading, setEditLoading] = useState(false);

    const handleSave = async () => {
        setEditLoading(true);
        await onEdit(img.id, currentAlt);
        setEditLoading(false);
        setIsEditing(false);
    };

    return (
        <div
            className="group inline-block w-full mb-6 break-inside-avoid bg-gray-100 rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl relative"
        >
            {/* Image (Clickable for non-editing mode) */}
            <div onClick={() => !isEditing && onImageClick(img)} className={!isEditing ? "cursor-pointer" : ""}>
                <Image
                    src={img.src}
                    alt={img.alt}
                    width={600}
                    height={600}
                    className="w-full h-auto block"
                />
            </div>

            {/* Admin Controls Overlay */}
            {isAdmin && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                    <div className="flex justify-between items-center space-x-2 pointer-events-auto">
                        {!isEditing && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-md text-xs font-semibold flex-1 transition-colors"
                                >
                                    Edit Alt
                                </button>
                                <button
                                    onClick={() => onDelete(img)}
                                    className="text-white bg-red-600 hover:bg-red-700 p-2 rounded-md text-xs font-semibold transition-colors"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Alt Text Interface */}
            {isAdmin && isEditing && (
                <div className="p-3 bg-white border-t border-gray-200">
                    <h4 className="text-sm font-semibold mb-1">Edit Alt Text:</h4>
                    <input
                        type="text"
                        value={currentAlt}
                        onChange={(e) => setCurrentAlt(e.target.value)}
                        className="w-full p-1 border rounded text-xs mb-2"
                        disabled={editLoading}
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={handleSave}
                            disabled={editLoading}
                            className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {editLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={() => {
                                setCurrentAlt(img.alt); // Reset to original
                                setIsEditing(false);
                            }}
                            className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

// --- Main Gallery Page Component ---
export default function GalleryPage() {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<SelectedImage>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // FIX 1: Declare the missing 'user' state
    const [user, setUser] = useState<AdminUser | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Image Add State
    const [newImageFile, setNewImageFile] = useState<File | null>(null);
    const [newImageAltText, setNewImageAltText] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);


    const fetchImages = async () => {
        setLoading(true);
        try {
            // FIX: Explicitly include 'created_at' in the select statement to resolve "column Images.created_at does not exist" error (42703).
            const { data: metadata, error } = await supabase
                .from('Images')
                .select('id, storage_path, alt_text')

            if (error) {
                console.error('Error fetching image metadata:', error);
                // The error object has already been logged, so we just use the custom message or the raw message.
                toast.error(error.message || 'Failed to load gallery data.');
                return;
            }

            // 2. Generate the public URL for each image using the Storage client
            const publicImages = metadata.map(item => {
                const { data: publicUrlData } = supabase.storage
                    .from('gallery-photos') // NOTE: Confirmed bucket name is 'gallery-photos'
                    .getPublicUrl(item.storage_path);

                return {
                    id: item.id,
                    src: publicUrlData.publicUrl,
                    alt: item.alt_text,
                    storage_path: item.storage_path
                };
            });

            setImages(publicImages);

        } catch (e) {
            console.error('An unexpected error occurred during image fetch:', e);
            toast.error('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    // --- Effects ---
    useEffect(() => {
        setIsClient(true);
        // FIX: Wrap fetchImages to silence "Promise returned... is ignored" warning
        const loadImages = () => {
            fetchImages();
        };
        loadImages();
    }, []);

    useEffect(() => {
        if (isClient) {
            const adminStr = localStorage.getItem('adminUser');
            try {
                const adminUser = adminStr ? JSON.parse(adminStr) as AdminUser : null;

                // FIX 2: Set the 'user' state with the retrieved admin object
                if (adminUser) {
                    setUser(adminUser);
                } else {
                    setUser(null);
                }

                setIsAdmin(!!adminUser && adminUser.is_admin);

            } catch {
                setIsAdmin(false);
                setUser(null);
            }
        }
    }, [isClient]);

    // --- Handlers ---
    const handleImageClick = (image: ImageItem) => {
        setSelectedImage(image);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setNewImageFile(e.target.files[0]);
        } else {
            setNewImageFile(null);
        }
    };

    const handleUploadImage = async (e: React.FormEvent) => {
        e.preventDefault();
        // The check for 'user' now correctly uses the state variable
        if (!newImageFile || !newImageAltText || !user) {
            toast.error('Admin user data missing. Please log in again.');
            return;
        }

        setIsSubmitting(true);

        // 1. Create FormData object to send file and text
        const formData = new FormData();
        formData.append('image', newImageFile);
        formData.append('altText', newImageAltText);
        // This line now correctly uses the state variable 'user'
        formData.append('userId', user.id.toString());

        try {
            // 2. Call the new secure API route
            const res = await fetch('/api/admin/gallery-upload', {
                method: 'POST',
                // Do NOT set Content-Type header when sending FormData
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                // Server-side error (e.g., admin check failed, upload failed)
                throw new Error(data.message || 'Server-side upload failed.');
            }

            toast.success('Image added successfully!');
            // Reset form and refetch data
            setNewImageFile(null);
            setNewImageAltText('');
            (document.getElementById('newImageFile') as HTMLInputElement).value = '';
            setShowAddForm(false);
            await fetchImages();

        } catch (e: any) {
            console.error('Upload Error:', e);
            toast.error(e.message || 'Failed to add image.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteImage = async (image: ImageItem) => {
        if (!confirm(`Are you sure you want to permanently delete the image: "${image.alt}"?`)) return;

        // Ensure user data is available for server authorization
        if (!user) {
            toast.error('Admin user data missing. Please log in again.');
            return;
        }

        setLoading(true); // Disable controls while deleting
        try {
            // CALL NEW SECURE API ROUTE
            const res = await fetch('/api/admin/gallery-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageId: image.id,
                    storagePath: image.storage_path,
                    userId: user.id.toString(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // The server performed the RLS bypass check and denied it or the DB operation failed.
                throw new Error(data.message || 'Server failed to execute deletion.');
            }

            toast.success('Image deleted successfully!');

            // Manually filter the local state immediately after confirmation from server
            setImages(prevImages => prevImages.filter(img => img.id !== image.id));

        } catch (e: any) {
            console.error('Delete Error:', e);
            toast.error(e.message || 'Failed to delete image.');

            // On failure, re-fetch the current truth from DB
            await fetchImages();

        } finally {
            setLoading(false);
        }
    };

    const handleEditAltText = async (id: number, newAlt: string) => {
        if (!newAlt.trim()) {
            toast.error('Alt text cannot be empty.');
            return;
        }

        if (!user) {
            toast.error('Admin user data missing. Cannot edit.');
            return;
        }

        try {
            // CALL NEW SECURE API ROUTE
            const res = await fetch('/api/admin/gallery-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageId: id,
                    newAlt: newAlt.trim(),
                    userId: user.id.toString(), // Pass user ID for server verification
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                // The server performed the RLS bypass check and denied it or the DB operation failed.
                throw new Error(data.message || 'Server failed to execute edit.');
            }

            toast.success('Alt text updated!');

            // Re-fetch data to reflect the change globally and update local component state
            await fetchImages();

        } catch (e: any) {
            console.error('Edit Error:', e);
            toast.error(e.message || 'Failed to update alt text.');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            {/* Navigation Bar */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 px-6 py-12 bg-gradient-to-b from-[#d1f0e5] to-white">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-green-100">
                        <h1 className="text-3xl font-bold text-[#2e7d6f] mb-6 text-center">Gallery</h1>

                        {/* Admin Panel Toggle & Form */}
                        {isAdmin && (
                            <div className="mb-8 p-4 border border-blue-100 bg-blue-50 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-blue-700">Admin Image Management</h2>
                                    <button
                                        onClick={() => setShowAddForm(!showAddForm)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                                    >
                                        {showAddForm ? 'Hide Form' : 'Add New Image'}
                                    </button>
                                </div>
                                {showAddForm && (
                                    <form onSubmit={handleUploadImage} className="space-y-4">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            id="newImageFile"
                                            onChange={handleImageFileChange}
                                            required
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            disabled={isSubmitting}
                                        />
                                        <textarea
                                            value={newImageAltText}
                                            onChange={(e) => setNewImageAltText(e.target.value)}
                                            placeholder="Enter alt text/caption for the image *"
                                            required
                                            rows={2}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !newImageFile || !newImageAltText.trim() || !user}
                                            className="w-full bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Uploading...' : 'Upload Image'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e7d6f] mx-auto mb-4" />
                                <p className="text-[#2e7d6f] font-medium">Loading gallery images...</p>
                            </div>
                        ) : images.length > 0 ? (
                            // Masonry Layout using CSS Columns:
                            <div className="columns-2 md:columns-3 gap-6">
                                {images.map((img) => (
                                    <ImageCard
                                        key={img.id}
                                        img={img}
                                        isAdmin={isAdmin}
                                        onImageClick={handleImageClick}
                                        onDelete={handleDeleteImage}
                                        onEdit={handleEditAltText}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 py-16">
                                <p className="text-lg">No images found. {isAdmin && 'Use the admin panel above to add the first image.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />

            {/* Modal - Renders if an image is selected */}
            {selectedImage && <ImageModal image={selectedImage} onClose={handleCloseModal} />}
        </div>
    );
}