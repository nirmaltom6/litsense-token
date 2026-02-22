import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProviderWrapper } from "@/components/AuthProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: {
        default: "Litsense Token System — Healthcare Queue Management",
        template: "%s | Litsense Token System",
    },
    description:
        "Multi-tenant SaaS token queue management for hospitals. RBAC, real-time tracking, multi-doctor support.",
    keywords: ["hospital queue", "token management", "healthcare", "multi-tenant", "SaaS"],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
                <AuthProviderWrapper>{children}</AuthProviderWrapper>
            </body>
        </html>
    );
}
