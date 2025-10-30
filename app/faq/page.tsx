'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

// Define a type for the FAQ items
type FaqItem = {
    question: string;
    answer: string;
};


const faqData: FaqItem[] = [
    {
        question: "What do I wear to yoga class?",
        answer: "Stretchy layers that move with you are ideal - leggings or joggers with a longline T shirt that won’t ride up during down dog are ideal. A sweatshirt for the relaxation to keep warm. We practice yoga in bare feet to increase foot health, balance and awareness.",
    },
    {
        question: "What should I bring with me?",
        answer: "There are as many props as you might like to imagine but the basics are a yoga mat, a cushion to sit on if you have tight hips and a blanket is useful to pad up your knees and for the relaxation.",
    },
    {
        question: "Is yoga just for women?",
        answer: "Yoga is definitely more popular with women in the west but it is an inclusive class and everyone is welcome. Yoga was originally only practiced by men and as a way of opening and stilling the mind and body to allow for hours of meditation. Yoga really is great for every body looking to improve their mind-body connection.",
    },
    {
        question: "I’m not very flexible - can I do yoga?",
        answer: "Yoga is a practice - it is not about the perfect pose it is about how it feels - and that is very personal. It's like any exercise, the more you do the better you will get to know and appreciate your body and the better it will respond. I can advise on correct alignment in the class and offer adjustments and alternatives - we can find a way! If you have any health concerns then you should always consult a Doctor before coming to class.",
    },
    {
        question: "CAN I COME BY MYSELF TO CLASS?",
        answer: "Yes, and most people do. It can feel a little daunting to come alone on the first night but it is a very welcoming class and a good way to meet like minded people. Alone or with a friend you can’t really have a conversation during the class so it doesn't matter.",
    },
    {
        question: "HOW DO I BOOK/ CHANGE A DATE?",
        answer: "Booking is via the link. Classes are non-refundable but can be rebooked for a more convenient time 24 hours before the class begins. If the class is full I can add you to a waiting list - just get in touch.",
    },
    {
        question: "IS THERE PARKING?",
        answer: "There is a large carpark in front of the community centre.",
    },
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