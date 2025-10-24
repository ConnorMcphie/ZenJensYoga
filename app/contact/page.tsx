'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import React, { useState } from "react";

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [status, setStatus] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('Sending...');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                setStatus('Message sent successfully!');
                setForm({ name: '', email: '', message: '' });
            } else {
                setStatus('Failed to send message. Please try again.');
            }
        } catch (err) {
            console.error(err);
            setStatus('An error occurred. Please try again later.');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#f0fdf4]">
            {/* Navigation Bar */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-1 px-6 py-12 bg-gradient-to-b from-[#d1f0e5] to-white">
                <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
                    <h1 className="text-3xl font-bold mb-4 text-[#2e7d6f]">Contact Us</h1>
                    <p className="mb-8 text-gray-600">
                        We would love to hear from you. Please fill out the form below and we’ll be in touch!
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            type="text"
                            placeholder="Your name"
                            required
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <input
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            type="email"
                            placeholder="Your email"
                            required
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            placeholder="Your message"
                            required
                            rows={5}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <button
                            type="submit"
                            className="bg-[#2e7d6f] text-white px-4 py-2 rounded hover:bg-[#004d40]"
                        >
                            Send Message
                        </button>
                        {status && (
                            <p className="text-sm text-gray-600 mt-2">{status}</p>
                        )}
                    </form>

                    <div className="mt-10 text-gray-700 space-y-2">
                        <p><strong>Email:</strong> zenjensyoga21@gmail.com</p>
                        <p><strong>Phone:</strong> +44 7731 943405</p>
                        <p><strong>Location:</strong> Viewpark Community Centre, Old Edinburgh Rd, Uddingston, G71 6PG</p>                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}

