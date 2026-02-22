import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProviderWrapper } from "@/components/AuthProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: {
        default: "Litsense Healthineers | Advanced Anaesthesia Solutions",
        template: "%s | Litsense Healthineers",
    },
    description:
        "Premium anaesthesia and healthcare queue management by Litsense Healthineers.",
    keywords: ["Litsense Healthineers", "anaesthesia solutions", "hospital queue", "token management", "Litsense"],
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
