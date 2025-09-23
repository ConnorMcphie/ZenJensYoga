"use client";
import { useState } from "react";
import Link from "next/link";


export default function Navbar() {
    const [open, setOpen] = useState(false);

    // Classes for the mobile menu animation
    const mobileMenuClasses = [
        "md:hidden bg-[#d0f2e6] px-6 pb-4 space-y-4 text-center",
        "absolute top-full left-0 right-0",
        "transition-all duration-300 origin-top",
        open ? "max-h-96 opacity-100 scale-y-100" : "max-h-0 opacity-0 scale-y-0",
        "overflow-hidden",
        "z-50",
        "shadow-lg",
    ].join(" ");

    return (
        <nav className="sticky top-0 z-50 bg-[#d0f2e6]  shadow-md px-6 py-4">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                {/* Brand */}
                <h1 className="text-2xl font-bold text-[#2e7d6f]">Zen Jen’s Yoga</h1>

                {/* Desktop menu */}
                <ul className="hidden md:flex space-x-6 text-[#2e7d6f] font-medium items-center">
                    <li><Link href="/" className="hover:text-[#004d40] transition-colors">Home</Link></li>
                    <li><Link href="/about" className="hover:text-[#004d40] transition-colors">About</Link></li>
                    <li><Link href="/contact" className="hover:text-[#004d40] transition-colors">Contact</Link></li>
                    <li>
                        <Link href="/booking">
                            <button
                                className="bg-[#81c784] hover:bg-[#66bb6a] text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 ml-4">
                                Book Now
                            </button>
                        </Link>
                    </li>
                </ul>

                {/* Hamburger button */}
                <button
                    aria-label="Toggle menu"
                    onClick={() => setOpen(!open)}
                    className="md:hidden focus:outline-none"
                >
                    <svg
                        className="w-8 h-8 text-[#2e7d6f]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        viewBox="0 0 200 200"
                    >
                        {open ? (
                            <>
                                {/* Warrior II pose using minimalist straight lines */}
                                <line x1="100" y1="60" x2="100" y2="120"/>
                                {/* Torso */}
                                <line x1="40" y1="90" x2="160" y2="90"/>
                                {/* Arms */}
                                <line x1="100" y1="120" x2="70" y2="160"/>
                                {/* Left leg bent */}
                                <line x1="70" y1="160" x2="60" y2="160"/>
                                {/* Foot */}
                                <line x1="100" y1="120" x2="140" y2="160"/>
                                {/* Right leg straight */}
                            </>
                        ) : (
                            <>
                                {/* Hamburger menu icon */}
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M33 50h133M33 100h133M33 150h133"
                                />
                            </>
                        )}
                    </svg>
                </button>

            </div>

            {/* Mobile menu */}
            <div className={mobileMenuClasses}>
                <Link href="/" onClick={() => setOpen(false)}
                      className="block text-[#2e7d6f] font-medium hover:text-[#004d40] transition-colors">
                    Home
                </Link>
                <Link href="/app/about" onClick={() => setOpen(false)}
                      className="block text-[#2e7d6f] font-medium hover:text-[#004d40] transition-colors">
                    About
                </Link>
                <Link href="/contact" onClick={() => setOpen(false)}
                      className="block text-[#2e7d6f] font-medium hover:text-[#004d40] transition-colors">
                    Contact
                </Link>
                <Link href="/booking" onClick={() => setOpen(false)}>
                    <button
                        className="w-full bg-[#81c784] hover:bg-[#66bb6a] text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300">
                        Book Now
                    </button>
                </Link>
            </div>
        </nav>
    );
}
