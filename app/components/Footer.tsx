"use client";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#d0f2e6]  px-6 py-6 flex justify-between items-center">
            {/* Social Icons */}
            <div className="flex space-x-6">
                <a
                    href="https://www.facebook.com/zenjen10yoga/?locale=en_GB"
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        src="/fbpic.ico"
                        alt="Facebook icon"
                        width={32}
                        height={32}
                        className="rounded-lg hover:opacity-80 transition"
                    />
                </a>

                <a href="mailto:jacarrick10@yahoo.co.uk" aria-label="Email">
                    <Image
                        src="/mail.ico"
                        alt="Email icon"
                        width={32}
                        height={32}
                        className="rounded-lg hover:opacity-80 transition"
                    />
                </a>
            </div>

            {/* Discrete Admin Link */}
            <Link
                href="/admin"
                className="text-xs text-[#2e7d6f] opacity-60 hover:opacity-100 hover:underline transition duration-200"
            >
                Admin
            </Link>
        </footer>
    );
}

