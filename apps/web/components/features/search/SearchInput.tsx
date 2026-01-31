"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SearchInputProps {
    initialValue?: string;
    onSearch: (value: string) => void;
    className?: string;
}

export function SearchInput({ initialValue = "", onSearch, className }: SearchInputProps) {
    const [value, setValue] = useState(initialValue);
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(value);
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className={cn(
                "relative w-full max-w-2xl mx-auto transition-all duration-300",
                className
            )}
            initial={false}
            animate={{ scale: isFocused ? 1.02 : 1 }}
        >
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Search className="h-5 w-5" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search Nepal's web..."
                    className="w-full pl-12 pr-4 py-4 rounded-full border border-input bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-lg"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                    {/* Optional: Add clear button or voice search later */}
                </div>
            </div>
        </motion.form>
    );
}
