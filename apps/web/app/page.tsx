"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/features/search/SearchInput";
import { LanguageToggle } from "@/components/features/search/LanguageToggle";
import { ResultCard } from "@/components/features/search/ResultCard";
import { useSearch } from "@/hooks/useSearch";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function SearchPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";
    const lang = searchParams.get("lang") || undefined;

    const [query, setQuery] = useState(initialQuery);
    const { data, isLoading, error } = useSearch(query, lang);

    // Update query state if URL changes
    useEffect(() => {
        setQuery(searchParams.get("q") || "");
    }, [searchParams]);

    const handleSearch = (newQuery: string) => {
        if (!newQuery.trim()) return;
        setQuery(newQuery);
        const params = new URLSearchParams(searchParams);
        params.set("q", newQuery);
        router.push(`/?${params.toString()}`);
    };

    const hasSearched = !!query;

    return (
        <main className="min-h-screen flex flex-col p-4 md:p-8 max-w-5xl mx-auto">
            <header className={`flex flex-col transition-all duration-500 ease-out ${hasSearched ? 'justify-start pt-4 mb-8' : 'justify-center min-h-[60vh]'}`}>

                <motion.div
                    layout
                    className="w-full flex flex-col items-center gap-6"
                >
                    {!hasSearched && (
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 pb-2"
                        >
                            BuckBuckGo
                        </motion.h1>
                    )}

                    <SearchInput
                        initialValue={query}
                        onSearch={handleSearch}
                        className={hasSearched ? "max-w-2xl" : "max-w-2xl shadow-xl"}
                    />

                    <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 mt-2"
                    >
                        <LanguageToggle />
                    </motion.div>

                    {/* Quick stats or tagline when not searching */}
                    {!hasSearched && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-muted-foreground text-center max-w-md mt-4"
                        >
                            Search millions of Nepali documents with AI-powered relevance.
                        </motion.p>
                    )}
                </motion.div>
            </header>

            {/* Results Section */}
            <AnimatePresence mode="wait">
                {hasSearched && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="w-full max-w-3xl mx-auto flex-1"
                    >
                        {isLoading && (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                            </div>
                        )}

                        {error && (
                            <div className="text-center py-20 text-destructive">
                                Something went wrong. Please try again.
                            </div>
                        )}

                        {data && data.results.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground">
                                No results found for "{query}".
                            </div>
                        )}

                        {data && data.results.length > 0 && (
                            <div className="space-y-6 pb-20">
                                <div className="text-sm text-muted-foreground mb-6">
                                    Found around {data.results.length} results
                                </div>
                                {data.results.map((result, i) => (
                                    <ResultCard key={result.id} result={result} index={i} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

export default function Home() {
    return (
        <Suspense>
            <SearchPageContent />
        </Suspense>
    );
}
