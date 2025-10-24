'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function FindUsPage() {

    // Dynamically import the Map component to avoid SSR issues with Leaflet
    const Map = useMemo(() => dynamic(() => import("@/components/Map"), { ssr: false }), []);

    return (
        <>
            <div className="flex flex-col min-h-screen bg-[#f0fdf4]"> {/* soft green background */}

                {/* Navigation Bar */}
                <Navbar />

                {/* Main Content */}
                <main className="flex-1 px-6 py-12 bg-gradient-to-b from-[#d1f0e5] to-white">
                    <div className="max-w-5xl mx-auto space-y-8">

                        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-green-100">
                            <h1 className="text-3xl font-bold text-[#2e7d6f] mb-4 text-center">Find Us</h1>


                            {/* Map Section */}
                            <section>
                                <div className="w-full">
                                    <Map/>
                                </div>
                                <div className="text-center mt-6 text-gray-800">
                                    <p className="font-semibold text-lg">Viewpark Community Centre</p>
                                    <p>Old Edinburgh Rd, Uddingston</p>
                                    <p>Glasgow, G71 6PG</p>
                                </div>
                            </section>
                        </div>

                    </div>
                </main>

                {/* Footer */}
                <Footer/>

            </div>
        </>
    );
}