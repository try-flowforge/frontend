"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { LuArrowDownRight, LuBrainCircuit, LuShieldCheck, LuUsers, LuZap } from "react-icons/lu";
import { Button } from "../ui/Button";
import Link from "next/link";
import { BiRocket } from "react-icons/bi";
import { FaNetworkWired, FaTelegramPlane } from "react-icons/fa";

const differentiators = [
  {
    title: "Web2 + Web3 Unified",
    desc: "Combine Telegram, Slack, & APIs with DeFi protocols (Uniswap, Aave) in one flow.",
    icon: <FaNetworkWired className="w-6 h-6 text-[#FF6500]" />,
    layout: "wide", // spans 2 cols
    accent: true,
  },
  {
    title: "Reasoning Agent",
    desc: "AI (GPT, Qwen, DeepSeek) understands intent and uses conditional logic.",
    icon: <LuBrainCircuit className="w-6 h-6 text-[#FF6500]" />,
    layout: "normal",
    accent: false,
  },
  {
    title: "Native Execution",
    desc: "Real on-chain transactions via Safe smart wallets on Arbitrum.",
    icon: <LuZap className="w-6 h-6 text-[#FF6500]" />,
    layout: "normal",
    accent: true,
  },
  {
    title: "Chat Interface",
    desc: "Set strategies and approve transactions via plain English in Telegram.",
    icon: <FaTelegramPlane className="w-6 h-6 text-[#FF6500]" />,
    layout: "normal",
    accent: false,
  },
  {
    title: "Verifiable Infra",
    desc: "Trust layers: Agent logic on EigenCompute (TEE) and Safe wallet security.",
    icon: <LuShieldCheck className="w-6 h-6 text-[#FF6500]" />,
    layout: "tall", // spans 2 rows
    accent: true,
  },
  {
    title: "Community Power",
    desc: "Discover, fork, and reuse proven workflow strategies published by the community.",
    icon: <LuUsers className="w-6 h-6 text-[#FF6500]" />,
    layout: "normal",
    accent: false,
  },
];

export function WhyFlowForgeSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    // "start start": Animation begins when top of section hits top of viewport
    // "end end": Animation ends when bottom of section hits bottom of viewport
    offset: ["start start", "end end"],
  });

  // --- PHASE 1: SCROLL IN
  const xSlide = useTransform(scrollYProgress, [0, 0.4], ["200vw", "0vw"]);

  // 1. Scale Down
  const scale = useTransform(scrollYProgress, [0.4, 0.5], [1, 0.2]);
  // 2. Color Fade (White -> Gray)
  const color = useTransform(scrollYProgress, [0.4, 0.5], ["#ffffff", "#71717a"]);
  // 3. Position Change (Center -> Top Left Padding)
  const topPos = useTransform(scrollYProgress, [0.4, 0.5], ["50%", "100px"]);
  const leftPos = useTransform(scrollYProgress, [0.4, 0.5], ["50%", "60px"]);
  // 4. Alignment Shift
  const translateVal = useTransform(scrollYProgress, [0.4, 0.5], ["-50%", "0%"]);

  const arrowOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  // Button Drops from top (-100vh) to top-right corner
  const buttonY = useTransform(scrollYProgress, [0.35, 0.45], ["-100vh", "0vh"]);

  // Grid fades in as title moves to corner (slightly before so it's visible sooner)
  const gridOpacity = useTransform(scrollYProgress, [0.35, 0.45], [0, 1]);
  const [gridOpacityState, setGridOpacityState] = useState(0);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  useMotionValueEvent(gridOpacity, "change", (v) => {
    setGridOpacityState(v);
    if (v > 0.12) setCardsRevealed(true);
  });

  // --- BACKGROUND EFFECT ---
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);

  return (
    <section
      ref={containerRef}
      className="relative h-[400vh] bg-black text-white selection:bg-[#ff6600cb] selection:text-white z-20"
    >
      {/* Sticky Viewport - This pins the content to the screen */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">

        {/* --- DOTTED CIRCULAR BACKGROUND --- */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.div
            style={{ scale: bgScale }}
            className="absolute inset-[-50%] w-[200%] h-[200%]"
          >
            {/* The Dot Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-size-[24px_24px] opacity-20" />
          </motion.div>
        </div>

        {/* --- ANIMATED MARQUEE TEXT --- */}
        <motion.h2
          className="absolute whitespace-nowrap font-bold uppercase tracking-tighter z-30 flex items-center gap-4"
          style={{
            x: xSlide,
            translateX: translateVal,
            translateY: translateVal,
            top: topPos,
            left: leftPos,
            scale: scale,
            color: color,
            transformOrigin: "top left",
            fontSize: "clamp(3rem, 8vw, 8rem)",
          }}
        >
          <span>Not just another workflow tool</span>

          {/* THE ARROW (Fades in at end of text) */}
          <motion.span style={{ opacity: arrowOpacity }} className="inline-flex items-center justify-center text-[#71717a]">
          <LuArrowDownRight className="w-[1em] h-[1em] stroke-[3px]" />
          </motion.span>
        </motion.h2>

        {/* --- 2. START CREATING BUTTON (Top Right) --- */}
        <motion.div
          className="absolute top-[40px] right-[40px] z-40"
          style={{
            y: buttonY,
          }}
        >
          <Link href="/automation-builder">
            <Button>
              <BiRocket className="w-4 h-4" />
              Start Creating
            </Button>
          </Link>
        </motion.div>

        <div
          className="absolute inset-x-0 mx-auto max-w-7xl px-6 z-30"
          style={{
            top: "30%",
            opacity: gridOpacityState,
            pointerEvents: gridOpacityState > 0 ? "auto" : "none",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {differentiators.map((item, index) => (
              <motion.div
                key={index}
                className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-700/60 backdrop-blur-md shadow-lg shadow-black/20"
                initial={{ opacity: 0, y: 40, scale: 0.92 }}
                animate={
                  cardsRevealed
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 40, scale: 0.92 }
                }
                transition={{
                  duration: 0.45,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="mb-4 inline-flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-800/80 border border-zinc-600/40">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-zinc-100">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}