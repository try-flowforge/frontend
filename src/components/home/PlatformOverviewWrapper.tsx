"use client";

import { useRef } from "react";
import {
    motion,
    useScroll,
    useTransform,
    type MotionValue,
} from "framer-motion";
import { MadeEasySection } from "./MadeEasySection";
import { FunctionalitySection } from "./FunctionalitySection";

type PlatformOverviewWrapperProps = {
    externalProgress?: MotionValue<number>;
};

export function PlatformOverviewWrapper({
    externalProgress,
}: PlatformOverviewWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Master Scroll Progress (0 to 1)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Prefer external timeline when provided, otherwise fall back to local scroll.
    const masterProgress = externalProgress ?? scrollYProgress;

    // --- TIMELINE REMAPPING ---
    // A. Problem Timeline:
    const problemProgress = useTransform(masterProgress, [0, 0.7], [0, 1]);

    // B. The Slide Transition:
    // Happens between 40% and 50%.
    const translateX = useTransform(
        masterProgress,
        [0.7, 0.75, 0.77, 0.8],
        ["0vw", "-20vw", "-20vw", "-100vw"]
    );

    // C. Solution Timeline:
    // Consumes the last 50% of the scroll. Maps 0.5-1.0 to 0.0-1.0.
    // Before 0.5, it stays at 0 (waiting).
    const solutionProgress = useTransform(masterProgress, [0.8, 1], [0, 1]);

    return (
        <section ref={containerRef} className="relative h-[1000vh] bg-black z-50">
            <div className="sticky top-0 h-screen overflow-hidden">
                <motion.div
                    className="flex h-screen w-[200vw]"
                    style={{ x: translateX }}
                >
                    <div className="w-screen h-screen shrink-0 overflow-hidden">
                        <MadeEasySection
                            heightClass="h-full"
                            progressExternal={problemProgress}
                        />
                    </div>
                    <div className="w-screen h-screen shrink-0 overflow-hidden">
                        <FunctionalitySection progress={solutionProgress} />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
