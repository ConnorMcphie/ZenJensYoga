import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Add the images configuration object here
    images: {
        // Allows loading images from your Supabase Storage domain
        remotePatterns: [
            {
                protocol: "https",
                hostname: "wwuvlvugxvhgoifwvkuw.supabase.co",
                port: "",
                pathname: "/storage/v1/object/public/**",
            },
        ],
    },
    /* config options here */
};

export default nextConfig;