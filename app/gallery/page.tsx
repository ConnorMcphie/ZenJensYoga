'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function GalleryPage() {

    // Placeholder images - you can replace these with your actual image paths
    const images = [
        "/budhaPose.jpg", // Example from about page
        "/portraitwithTree.jpg", // Example from home page
        // Add more image paths here e.g., "/gallery/image1.jpg", "/gallery/image2.jpg"
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            {/* Navigation Bar */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 px-6 py-12 bg-gradient-to-b from-[#d1f0e5] to-white">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-green-100">
                        <h1 className="text-3xl font-bold text-[#2e7d6f] mb-6 text-center">Gallery</h1>

                        {images.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {images.map((src, index) => (
                                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-105">
                                        <Image
                                            src={src}
                                            alt={`Gallery image ${index + 1}`}
                                            width={500}
                                            height={500}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 py-16">
                                <p className="text-lg">Our gallery is coming soon!</p>
                                <p>Check back later to see photos from our classes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}