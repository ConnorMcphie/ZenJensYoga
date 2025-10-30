'use client';

import Image from "next/image";
import{useEffect, useState} from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";


const quotes =[
    "Yoga is the journey of the self, through the self, to the self. – Bhagavad Gita",
    "The nature of yoga is to shine the light of awareness into the darkest corners of the body. – Jason Crandell",
    "Yoga takes you into the present moment. The only place where life exists.",
    "Inhale the future, exhale the past.",
    "Yoga is the art work of awareness on the canvas of body, mind, and soul.",
    "Yoga is a mirror to look at ourselves from within",
    "Yoga does not just change the way we see things, it transforms the person who sees.",
    "When you listen to yourself, everything comes naturally. It comes from inside, like a kind of will to do something. Try to be sensitive. That is yoga.",
    "Yoga is the dance of every cell with the music of every breath that creates inner serenity and harmony"
];

export default function Home() {



    const [quote, setQuote] = useState("");


    useEffect(()=> {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setQuote(quotes[randomIndex]);
    }, []);


    return (
        <>
            <div className="flex flex-col min-h-screen bg-[#f0fdf4]"> {/* soft green background */}

                {/* Navigation Bar */}
                <Navbar />


                {/* Main Content */}
                <main className="flex-1 px-6 py-12 bg-black/50 bg-[url('/Forrest-Bg2.jpg')] bg-blend-multiply bg-cover bg-center bg-fixed">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

                        <div className="space-y-10">

                            {/* --- II. QUOTE BLOCK STYLE IMPROVEMENT --- */}
                            <div
                                className="bg-[#ecfdf5] p-6 italic text-center text-lg
                                        text-gray-700 max-w-3xl mx-auto shadow-xl rounded-xl mb-10 border border-green-200"> {/* Soft green BG, stronger shadow, rounded corners */}
                                “{quote}”
                            </div>


                            {/* about + Image Section */}
                            <section
                                className="flex flex-col md:flex-row gap-8 bg-white rounded-xl shadow-xl p-8 border border-green-100">

                                {/* Text Section */}
                                <div className="w-full md:w-1/2 flex flex-col justify-center">
                                    {/* --- III. TYPOGRAPHY HIERARCHY IMPROVEMENT --- */}
                                    <h1 className="text-2xl font-bold text-[#2e7d6f] mb-6">Contemporary yoga classes in Bothell / Uddingston </h1>

                                    {/* Intro section */}
                                    <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                                        <p>
                                            Zen Jen’s Yoga provides a warm, welcoming class to engage breath with
                                            movement
                                            in a mindful and positive way —
                                            balancing strength with flexibility, mind with body, and bringing you to a
                                            deeper connection with yourself.
                                        </p>
                                        <p>
                                            Yoga is a way of practicing self-compassion. It supports mental, emotional,
                                            physical, and spiritual health,
                                            promoting balance, harmony, and inner peace.
                                        </p>
                                    </div>

                                </div>

                                {/* Image Section */}
                                <div className="w-full md:w-1/2 flex justify-center items-center">
                                    <div className="overflow-hidden rounded-xl shadow-lg  w-full">
                                        <Image
                                            src="/portraitwithTree.jpg"
                                            alt="Yoga class"
                                            width={500}
                                            height={500}
                                            className="object-cover w-full h-full "
                                        />
                                    </div>
                                </div>

                            </section>

                            {/* Find Us Section (Replaced Map) */}
                            <section className="text-center bg-white rounded-xl shadow-xl p-8 border border-green-100">
                                <h2 className="text-2xl font-bold text-[#004d40] mb-4">Come and find us!</h2>
                                <p className="text-lg text-gray-700 mb-6">
                                    Classes are held at the Viewpark Community Centre in Uddingston.
                                </p>
                                <Link href="/find-us">
                                    <span className="bg-[#81c784] hover:bg-[#66bb6a] text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-300">
                                        View Map & Location
                                    </span>
                                </Link>
                            </section>

                        </div>
                    </div>
                </main>

                <Footer/>

            </div>
        </>
    );
}