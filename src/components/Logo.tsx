"use client";

import React from "react";

interface LogoProps {
    className?: string;
    showTagline?: boolean;
    white?: boolean;
}

export default function Logo({ className = "", showTagline = true, white = false }: LogoProps) {
    return (
        <div className={`flex flex-col justify-center ${className} group select-none`}>
            <div className="flex items-center flex-shrink-0">
                <span
                    className={`
                        font-black tracking-tighter whitespace-nowrap transition-all duration-300
                        text-lg sm:text-xl lg:text-2xl
                        ${white
                            ? 'text-white'
                            : 'bg-gradient-to-r from-[#0057B8] via-[#0072CE] to-[#0057B8] dark:from-[#40E0FF] dark:via-[#0072CE] dark:to-[#40E0FF] bg-[length:200%_auto] bg-clip-text text-transparent group-hover:bg-[100%_0] transition-[background-position] duration-700'
                        }
                    `}
                    style={!white ? { WebkitBackgroundClip: 'text' } : {}}
                >
                    Litsense Healthineers
                </span>
            </div>
            {showTagline && (
                <div
                    className="text-[9px] sm:text-[10px] font-bold tracking-[0.05em] text-muted/60 whitespace-nowrap uppercase mt-[-4px] ml-[2px] transition-opacity group-hover:text-primary transition-colors duration-300"
                    style={{
                        fontFamily: "'Inter', sans-serif",
                    }}
                >
                    A Division of Litsense
                </div>
            )}
        </div>
    );
}
