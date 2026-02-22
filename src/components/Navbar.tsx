"use client";

import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { Menu } from "lucide-react";

export default function Navbar() {
    return (
        <header
            className="px-4 md:px-8 h-18 flex items-center justify-between border-b border-gray-200 dark:border-white/10 sticky top-0 z-50 bg-background/80 backdrop-blur-xl"
        >
            <div className="flex-shrink-0">
                <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-[1.01] active:scale-95">
                    <Logo className="h-full" />
                </Link>
            </div>

            <nav className="hidden md:flex flex-1 justify-center gap-8 text-sm font-bold tracking-tight">
                <a href="#features" className="text-muted hover:text-primary transition-all relative group py-2">
                    Solutions
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </a>
                <a href="#how-it-works" className="text-muted hover:text-primary transition-all relative group py-2">
                    Methodology
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </a>
                <a href="#stats" className="text-muted hover:text-primary transition-all relative group py-2">
                    Impact
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
                </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <ThemeToggle />

                <Link
                    href="/login"
                    className="hidden sm:inline-flex text-xs md:text-sm font-black bg-primary hover:opacity-90 text-white dark:text-[#0a1628] px-5 md:px-7 py-2.5 rounded-full transition-all shadow-lg shadow-primary/20 active:translate-y-0.5"
                >
                    Portal Login
                </Link>

                <button className="md:hidden p-2 text-muted hover:text-primary transition-colors">
                    <Menu className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
}
