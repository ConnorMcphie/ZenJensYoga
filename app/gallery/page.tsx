'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from '../../lib/supabaseClient'; // Import Supabase client


// Define types for clarity
type ImageItem = {
    src: string; // This will hold the full public URL from Supabase Storage
    alt: string;
    storage_path: string; // The path used to retrieve the public URL
};
type SelectedImage = ImageItem | null;

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


export default function GalleryPage() {
    const [images, setImages] = useState<ImageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<SelectedImage>(null);

    // --- Data Fetching Logic ---
    useEffect(() => {
        const fetchImages = async () => {
            setLoading(true);
            try {
                // 1. Fetch the metadata (storage_path and alt_text) from the 'Images' table
                const { data: metadata, error } = await supabase
                    .from('Images')
                    .select('storage_path, alt_text')

                if (error) {
                    console.error('Error fetching image metadata:', error);
                    return;
                }

                // 2. Generate the public URL for each image using the Storage client
                const publicImages = metadata.map(item => {
                    // NOTE: Change 'gallery-photos' to your actual bucket name if different.
                    const { data: publicUrlData } = supabase.storage
                        .from('gallery-photos')
                        .getPublicUrl(item.storage_path);

                    return {
                        src: publicUrlData.publicUrl,
                        alt: item.alt_text,
                        storage_path: item.storage_path // Keep the path for reference
                    };
                });

                setImages(publicImages);

            } catch (e) {
                console.error('An unexpected error occurred during image fetch:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchImages();
    }, []);
    // --- End Data Fetching Logic ---


    const handleImageClick = (image: ImageItem) => {
        setSelectedImage(image);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
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

                        {loading ? (
                            <div className="text-center py-16">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2e7d6f] mx-auto mb-4" />
                                <p className="text-[#2e7d6f] font-medium">Loading gallery images...</p>
                            </div>
                        ) : images.length > 0 ? (
                            // Masonry Layout using CSS Columns:
                            <div className="columns-2 md:columns-3 gap-6">
                                {images.map((img, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleImageClick(img)}
                                        className="cursor-pointer inline-block w-full mb-6 break-inside-avoid bg-gray-100 rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl"
                                    >
                                        {/* Image source now uses the dynamically fetched public URL (img.src) */}
                                        <Image
                                            src={img.src}
                                            alt={img.alt}
                                            width={600}
                                            height={600}
                                            className="w-full h-auto block"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 py-16">
                                <p className="text-lg">No images found. Please check your Supabase setup.</p>
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