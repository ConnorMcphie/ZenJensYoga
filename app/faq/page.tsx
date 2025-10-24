'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

// Define a type for the FAQ items
type FaqItem = {
    question: string;
    answer: string;
};

// Add your questions and answers here
const faqData: FaqItem[] = [
    {
        question: "What should I bring to my first class?",
        answer: "Please bring your own yoga mat, a water bottle, and wear comfortable clothing you can move in. We recommend layers, as you'll warm up during the class and cool down during relaxation."
    },
    {
        question: "I'm a complete beginner, can I still join?",
        answer: "Absolutely! All our classes are suitable for all levels, including beginners. Jen provides modifications and guidance for everyone, ensuring you can practice safely and comfortably."
    },
    {
        question: "What is your cancellation policy?",
        answer: "All bookings are non-refundable. However, you may reschedule your session up to 24 hours before the class start time, subject to availability. Cancellations or reschedules cannot be made within 24 hours of the class."
    },
    {
        question: "Where are the classes held?",
        answer: "Our classes are held at the Viewpark Community Centre, Old Edinburgh Rd, Uddingston, Glasgow, G71 6PG. You can find a map on our 'Find Us' page."
    }
];

// Reusable component for the accordion item
function FaqAccordionItem({ item, isOpen, onClick }: { item: FaqItem; isOpen: boolean; onClick: () => void; }) {
    return (
        <div className="border-b border-green-100">
            <button
                onClick={onClick}
                className="flex justify-between items-center w-full py-4 text-left"
            >
                <span className="text-lg font-medium text-gray-800">{item.question}</span>
                <span className="text-2xl text-green-700">{isOpen ? '−' : '+'}</span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <p className="pt-0 pb-4 text-gray-600 leading-relaxed">{item.answer}</p>
            </div>
        </div>
    );
}

export default function FaqPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleClick = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            {/* Navigation Bar */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 px-6 py-12 bg-gradient-to-b from-[#d1f0e5] to-white">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-green-100">
                        <h1 className="text-3xl font-bold text-[#2e7d6f] mb-8 text-center">Frequently Asked Questions</h1>

                        <div className="space-y-2">
                            {faqData.map((item, index) => (
                                <FaqAccordionItem
                                    key={index}
                                    item={item}
                                    isOpen={openIndex === index}
                                    onClick={() => handleClick(index)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}