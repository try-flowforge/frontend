"use client";

import { HeroBackgroundAnimation } from "./HeroBackgroundAnimation";
import { Typography } from "../ui/Typography";
import { RotatingElement } from "../ui/RotatingElement";
import { AiOutlineNodeIndex } from "react-icons/ai";
import { MdCropSquare } from "react-icons/md";
import { motion, MotionValue } from "framer-motion";
import {
    FaLink,
    FaNetworkWired,
    FaProjectDiagram,
    FaCodeBranch
} from "react-icons/fa";
import { BiRocket } from "react-icons/bi";
import { Button } from "../ui/Button";
import Link from "next/link";

interface HeroSectionProps {
    gapAnimation?: MotionValue<string>;
}

const ROTATING_ICONS = [
    { Icon: FaLink, name: "Link" },
    { Icon: FaNetworkWired, name: "Network" },
    { Icon: FaProjectDiagram, name: "Diagram" },
    { Icon: FaCodeBranch, name: "Branch" },
    { Icon: AiOutlineNodeIndex, name: "Link" },
];

const ROTATING_SYMBOLS = ["%", "$", "#", "@", "&"];

export function HeroSection({ gapAnimation }: HeroSectionProps) {
    return (
        <section className="relative h-screen w-full flex flex-col gap-5 items-center justify-center overflow-hidden bg-black">
            {/* --- BACKGROUND LAYER 1: Gradient, Dot Grid --- */}
            <div className="absolute inset-0 bg-linear-to-b from-black/30 via-[#0B192C]/40 to-black/30" />
            <div
                className="absolute inset-0 opacity-20 z-0"
                style={{
                    backgroundImage: "radial-gradient(#6f6f6f 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                    maskImage:
                        "radial-gradient(ellipse at center, black 40%, transparent 80%)",
                }}
            />

            {/* --- BACKGROUND LAYER 2: Flowchart Animation --- */}
            <HeroBackgroundAnimation />

            {/* --- FOREGROUND CONTENT --- */}
            <motion.div
                className="relative z-10 w-full flex flex-col items-center justify-center"
                style={gapAnimation ? { gap: gapAnimation } : { gap: "0.5rem" }}
            >
                <motion.div
                    initial={{ clipPath: "inset(0 100% 0 0)" }}
                    animate={{ clipPath: "inset(0 0% 0 0)" }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                    className="flex items-center justify-center gap-3"
                >
                    <Typography variant="h1" className="flex items-center justify-center gap-3">
                        THE CREATIVE{" "}
                        <RotatingElement
                            items={ROTATING_ICONS.map((item) => ({ Icon: item.Icon }))}
                            startDelay={500}
                            changeInterval={200}
                        />{" "}
                        PLACE FOR
                    </Typography>
                </motion.div>

                <motion.div
                    initial={{ clipPath: "inset(0 100% 0 0)" }}
                    animate={{ clipPath: "inset(0 0% 0 0)" }}
                    transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                    className="flex items-center justify-center"
                >
                    <Typography variant="h1">
                        <MdCropSquare className="w-4 h-4 md:w-7 md:h-7 mb-4 md:mb-8 inline" /> WEB2{" "}
                        <span className="mx-3">
                            <RotatingElement
                                items={ROTATING_SYMBOLS.map((symbol) => ({ text: symbol }))}
                                startDelay={800}
                                changeInterval={200}
                                className="inline-block"
                            />
                        </span>{" "}
                        WEB3 AUTOMATION
                    </Typography>
                </motion.div>
            </motion.div>

            <div className=" items-center gap-4 hidden">
                {/* Agent Onboarding */}
                <Link href="/agent-onboarding">
                    <Button border borderColor="#fb923c" className="w-[150px]">
                        Agent
                    </Button>
                </Link>

                {/* Start Creating Button */}
                <Link href="/automation-builder">
                    <Button className="w-[150px]">
                        <BiRocket className="w-4 h-4" />
                        Start Creating
                    </Button>
                </Link>
            </div>
        </section>
    );
}
