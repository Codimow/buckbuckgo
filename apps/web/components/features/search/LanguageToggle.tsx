"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function LanguageToggle() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const currentLang = searchParams.get("lang") || "all"; // 'all', 'en', 'ne'

    const handleToggle = (lang: string) => {
        const params = new URLSearchParams(searchParams);
        if (lang === 'all') {
            params.delete("lang");
        } else {
            params.set("lang", lang);
        }
        // Reset cursor on filter change
        params.delete("cursor");
        router.push(`/?${params.toString()}`);
    };

    const options = [
        { value: "all", label: "All" },
        { value: "en", label: "EN" },
        { value: "ne", label: "नेपाली" },
    ];

    return (
        <div className="flex bg-secondary/50 p-1 rounded-full border border-border/50 relative">
            {options.map((option) => {
                const isActive = (option.value === "all" && !searchParams.get("lang")) || currentLang === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => handleToggle(option.value)}
                        className={cn(
                            "relative px-4 py-1.5 text-sm font-medium rounded-full transition-colors z-10",
                            isActive ? "text-primary" : "text-muted-foreground hover:text-primary/80"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="lang-toggle"
                                className="absolute inset-0 bg-background shadow-sm rounded-full border border-border/50 -z-10"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
