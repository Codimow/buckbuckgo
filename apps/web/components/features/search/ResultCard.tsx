"use client";

import { motion } from "framer-motion";

interface SearchResult {
    id: string;
    title: string;
    url: string;
    snippet: string;
}

export function ResultCard({ result, index }: { result: SearchResult; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group p-5 rounded-xl border border-transparent hover:border-border/50 hover:bg-card/40 hover:shadow-sm transition-all duration-200 -mx-4"
        >
            <div className="flex flex-col gap-1">
                <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground truncate hover:text-primary transition-colors mb-1"
                >
                    {result.url}
                </a>
                <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <h3 className="text-xl font-semibold text-primary group-hover:underline decoration-primary/30 underline-offset-4 decoration-2">
                        {result.title}
                    </h3>
                </a>
                <p
                    className="text-muted-foreground leading-relaxed mt-2 text-[15px]"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
            </div>
        </motion.div>
    );
}
