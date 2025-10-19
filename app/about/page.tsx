'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";


export default function Page() {

    return (
        <>
            <div className="flex flex-col min-h-screen bg-[#f0fdf4]"> {/* soft green background */}

                {/* Navigation Bar */}
                <Navbar/>


                {/* Main Content */}
                <main className="flex-1 px-4 py-12 bg-gradient-to-b from-[#d1f0e5] to-white">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">

                        {/* TEXT SECTION */}
                        <div className="space-y-6 text-gray-800 text-base sm:text-lg leading-relaxed">
                            <h2 className="text-3xl sm:text-4xl font-bold text-[#2e7d6f] mb-4">Meet Jen</h2>

                            <p>
                                Jen has been practicing yoga since her twenties and eventually took the step to train
                                with
                                The Seasonal Yoga Academy in Glasgow in 2016.
                            </p>

                            <p className="italic text-[#2e7d6f] bg-[#ecfdf5] p-4 rounded-lg border-l-4 border-[#2e7d6f] shadow-sm">
                                Yoga has been a huge part of my life journey. It has been a transformative tool as I
                                have dealt with
                                life’s ups and downs, learning and growing from each of the many challenges I have
                                faced.
                            </p>

                            <p>
                                Whenever I feel disconnected, overwhelmed or in need of guidance, I stretch my body,
                                reconnect with
                                my breath and sit in meditation. This always brings me back to my centre and gives me a
                                deeper
                                sense of perspective, clarity and peace.
                            </p>

                            <p className="italic">
                                Making space for these practices daily has been life-changing.
                            </p>

                            <p>
                                Jen has been teaching yoga classes for years and brings a wealth of experience.
                            </p>

                            <div className="bg-[#f3faf8] p-4 rounded-lg border-l-4 border-[#81c784] shadow-sm">
                                <p className="italic text-[#2e7d6f]">
                                    “My teaching focus is on relieving stress through the practice of yoga — life is
                                    busy,
                                    a constant hustle and juggle of demands. My classes are aimed at taking an hour out
                                    of this buzz,
                                    to slow down, breathe, and ease tension in mind and body.”
                                </p>
                                <p className="mt-2">
                                    Classes begin with grounding, followed by stronger postures to burn stress hormones
                                    like cortisol,
                                    and end with a deeply relaxing Yoga Nidra practice.
                                </p>
                                <p className="mt-2 font-semibold text-[#2e7d6f]">
                                    Expect to feel refreshed, relaxed, and uplifted.
                                </p>
                            </div>
                        </div>

                        {/* IMAGE SECTION */}
                        <div className="w-full">
                            <div className="overflow-hidden rounded-xl shadow-xl aspect-[3/4] bg-[#e6f4f1]">
                                {/* Replace with actual image */}
                                <Image
                                    src="/budhaPose.jpg"
                                    alt="Jen, yoga instructor"
                                    width={600} // Add appropriate width
                                    height={800} // Add appropriate height (maintain aspect ratio)
                                    className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                                />
                            </div>
                            <p className="text-center mt-3 text-[#2e7d6f] font-medium">Jen, Founder of Zen Jen’s
                                Yoga</p>
                        </div>

                    </div>
                </main>


                {/* Footer */}
                <Footer/>

            </div>
        </>
    );
}
