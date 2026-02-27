"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { LuArrowDownRight, LuCheck, LuGitBranch, LuServer, LuTriangle, LuZap } from "react-icons/lu";
import { Button } from "../ui/Button";
import Link from "next/link";
import { BiRocket } from "react-icons/bi";

export function WhyFlowForgeSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [arrowTarget, setArrowTarget] = useState<1 | 2>(1);

  // --- PHASE 1: SCROLL IN
  const xSlide = useTransform(scrollYProgress, [0, 0.3], ["100vw", "-40vw"]);

  const barHeight = useTransform(scrollYProgress, [0.33, 0.4], ["0vh", "50vh"]);
  const barWidth = useTransform(scrollYProgress, [0.33, 0.34], ["0%", "100%"]);

  const barTop = useTransform(scrollYProgress, [0.4, 0.5], ["50%", "0%"]);
  const barTranslateY = useTransform(scrollYProgress,
    [0.4, 0.5, 0.5, 0.55],
    ["-50%", "0%", "0%", "-120%"]
  );
  const textScale = useTransform(scrollYProgress, [0.4, 0.5], [1, 1.9])
  const textDisplay = useTransform(scrollYProgress, [0, 0.4], ["flex", "none"]);

  // --- PHASE 2: REVEAL CARDS
  const revealedDisplay = useTransform(scrollYProgress, [0.4, 0.5], ["none", "flex"]);
  const bgHeight = useTransform(scrollYProgress, [0.4, 0.5], ["0vh", "100vh"]);
  const revealedTop = useTransform(scrollYProgress, [0.4, 0.5], ["50%", "0%"]);

  // --- HEADINGS ANIMATION
  const headColor1 = useTransform(scrollYProgress, [0.7, 0.72, 1], ["#ffffff", "#ffffff4d", "#ffffff4d"]);
  const headTop1 = useTransform(scrollYProgress, [0.7, 0.72, 1], ["40%", "25%", "25%"]);
  const headSize1 = useTransform(scrollYProgress, [0.7, 0.72, 1], ["3vw", "2vw", "2vw"]);

  const headColor2 = useTransform(scrollYProgress, [0.7, 0.72, 1], ["#ffffff4d", "#ffffff", "#ffffff"]);
  const headTop2 = useTransform(scrollYProgress, [0.7, 0.72, 1], ["60%", "40%", "40%"]);
  const headSize2 = useTransform(scrollYProgress, [0.7, 0.72, 1], ["2vw", "3vw", "3vw"]);

  // --- CARDS STACKING ANIMATION ---

  // Card 1: Stays visible, but scales down slightly when Card 2 enters
  const desc1Scale = useTransform(scrollYProgress, [0.7, 0.85], [1, 0.95]); 
  const desc1Opacity = useTransform(scrollYProgress, [0.7, 0.85], [1, 0.5]); 
  
  // Card 2: Comes from the right side and stacks on top
  const descDisplay2 = useTransform(scrollYProgress, [0.69, 0.7], ["none", "flex"]);
  const desc2X = useTransform(scrollYProgress, [0.7, 0.85], ["150%", "0%"]); 

  // Button Drops from top (-100vh) to top-right corner
  const buttonY = useTransform(scrollYProgress, [0, 0.1], ["-100vh", "0vh"]);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      setArrowTarget(v >= 0.72 ? 2 : 1);
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <section
      ref={containerRef}
      className="relative h-[1000vh] bg-black text-white selection:bg-[#ff6600cb] selection:text-white z-20"
    >
      {/* Sticky Viewport - This pins the content to the screen */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* --- DOTTED CIRCULAR BACKGROUND --- */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div className="absolute inset-[-50%] w-[200%] h-[200%]">
            <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-size-[24px_24px] opacity-20" />
          </div>
        </div>

        {/* --- THE BLACK EXPANDING DIV (The "Mask") --- */}
        <motion.div
          style={{
            width: barWidth,
            height: barHeight,
            top: barTop,
            y: barTranslateY,
          }}
          className="absolute left-1/2 -translate-x-1/2 z-40 bg-[#040404] pointer-events-none"
        />

        {/* --- ANIMATED MARQUEE TEXT --- */}
        <motion.h2
          className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap font-bold uppercase tracking-tighter z-30 items-center gap-4"
          style={{
            x: xSlide,
            fontSize: "clamp(3rem, 8vw, 8rem)",
            scale: textScale,
            display: textDisplay,
          }}
        >
          <span>Not just another workflow tool</span>
          <motion.span className="inline-flex items-center justify-center text-[#71717a]">
            <LuArrowDownRight className="w-[1em] h-[1em] stroke-[3px]" />
          </motion.span>
        </motion.h2>

        {/* --- 2. START CREATING BUTTON (Top Right) --- */}
        <motion.div
          className="absolute top-[40px] right-[40px] z-40"
          style={{ y: buttonY }}
        >
          <Link href="/automation-builder">
            <Button>
              <BiRocket className="w-4 h-4" />
              Start Creating
            </Button>
          </Link>
        </motion.div>

        {/* background div for next animation */}
        <motion.div
          style={{ display: revealedDisplay, top: revealedTop, height: bgHeight }}
          className="absolute inset-0 bg-black flex items-center justify-center z-30"
        >
          <div className="relative w-full h-full flex flex-col justify-center">
            {/* Top Left Label */}
            <div className="absolute top-14 left-20 z-20 flex items-center gap-2 text-md font-semibold tracking-wide text-white uppercase">
              <span>Not just another workflow tool</span>
              <LuArrowDownRight />
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex w-full h-full relative mt-20">

              {/* === LEFT SIDE: SCROLLING TITLES === */}
              <div className="w-full md:w-2/3 h-full relative flex items-center">
                {/* Item 1 */}
                <motion.h2
                  style={{ color: headColor1, top: headTop1, fontSize: headSize1 }}
                  className="w-full text-7xl font-bold uppercase tracking-tighter transition-colors duration-300 flex absolute left-10"
                >
                  <span className="inline-flex w-[60px] shrink-0">
                    {arrowTarget === 1 ? (
                      <motion.span
                        layoutId="why-flowforge-heading-arrow"
                        transition={{ type: "spring", stiffness: 650, damping: 45 }}
                        className="inline-flex text-[#FF6500] w-[60px]"
                      >
                        <LuArrowDownRight className="w-[60px]" />
                      </motion.span>
                    ) : (
                      <span className="inline-flex w-[60px] opacity-0">
                        <LuArrowDownRight className="w-[60px]" />
                      </span>
                    )}
                  </span>
                  <span>TRADITIONAL PLATFORMS<br /> MANUAL & REACTIVE</span>
                </motion.h2>

                {/* Item 2 */}
                <motion.h2
                  style={{ color: headColor2, top: headTop2, fontSize: headSize2 }}
                  className="w-full text-5xl font-bold uppercase tracking-tighter transition-colors duration-300 flex absolute left-10"
                >
                  <span className="inline-flex w-[60px] shrink-0">
                    {arrowTarget === 2 ? (
                      <motion.span
                        layoutId="why-flowforge-heading-arrow"
                        transition={{ type: "spring", stiffness: 650, damping: 45 }}
                        className="inline-flex text-[#FF6500] w-[60px]"
                      >
                        <LuArrowDownRight className="w-[60px]" />
                      </motion.span>
                    ) : (
                      <span className="inline-flex w-[60px] opacity-0">
                        <LuArrowDownRight className="w-[60px]" />
                      </span>
                    )}
                  </span>
                  <span>FLOWFORGE <br /> AUTOMATED & GUARANTEED</span>
                </motion.h2>
              </div>

              {/* === RIGHT SIDE: STACKING CARDS === */}
              {/* Increased height to 600px to accommodate full content */}
              <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[35%] h-[600px]">
                
                {/* Desc 1 - Bottom Card */}
                <motion.div
                  style={{ 
                    scale: desc1Scale, 
                    opacity: desc1Opacity 
                  }}
                  className="absolute inset-0 z-10 origin-center"
                >
                   <div className="w-full h-full relative overflow-hidden rounded-xl border border-red-900/30 bg-[#080303] shadow-[0_0_60px_-10px_rgba(127,29,29,0.2)] p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                      <LuTriangle className="w-4 h-4" />
                      <span>The Old Way</span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      PATH: CHAOS
                    </div>
                  </div>

                  <div className="space-y-6 text-sm">
                    {/* PATH A: MANUAL */}
                    <div className="space-y-3 relative">
                      <div className="absolute left-[7px] top-3 bottom-0 w-px bg-zinc-800" />

                      <div className="flex gap-4">
                        <div className="relative z-10 w-4 h-4 mt-1 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-500">1</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-zinc-200 font-medium">Keep monitoring conditions</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">Staring at price, markets, trades.</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="relative z-10 w-4 h-4 mt-1 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-500">2</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-zinc-200 font-medium">Rush to platform when conditions click</span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">BTC drops to $60k -&gt High stress buy window.</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="relative z-10 w-4 h-4 mt-1 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-500">3</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-zinc-300">Wallet signing & reading fine print</span>
                            <span className="text-zinc-500 font-mono text-xs">2-3 mins</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="relative z-10 w-4 h-4 mt-1 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-500">4</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-baseline">
                            <span className="text-zinc-300">Wait for tx mine, refresh constantly</span>
                            <span className="text-zinc-500 font-mono text-xs">~1 min</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEPARATOR "OR" */}
                    <div className="relative py-2 flex items-center">
                      <div className="grow border-t border-zinc-800"></div>
                      <span className="shrink-0 mx-4 text-xs text-zinc-500 font-bold uppercase bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">OR: Write a Script</span>
                      <div className="grow border-t border-zinc-800"></div>
                    </div>

                    {/* PATH B: DEV */}
                    <div className="space-y-3 relative pl-2">
                      <div className="absolute left-[15px] top-3 bottom-0 w-px border-l border-dashed border-zinc-700/50" />

                      <div className="flex gap-4 items-center">
                        <div className="relative z-10 w-3 h-3 rounded-sm bg-zinc-800 flex items-center justify-center"><LuGitBranch className="w-2 h-2 text-zinc-500" /></div>
                        <div className="flex-1 flex justify-between text-zinc-400 text-xs">
                          <span>Get API keys for data fetch</span>
                          <span className="font-mono">5 min</span>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="relative z-10 w-3 h-3 rounded-sm bg-zinc-800 flex items-center justify-center"><LuGitBranch className="w-2 h-2 text-zinc-500" /></div>
                        <div className="flex-1 flex justify-between text-zinc-400 text-xs">
                          <span>Write the script</span>
                          <span className="font-mono">20 min</span>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="relative z-10 w-3 h-3 rounded-sm bg-zinc-800 flex items-center justify-center"><LuGitBranch className="w-2 h-2 text-zinc-500" /></div>
                        <div className="flex-1 flex justify-between text-zinc-400 text-xs">
                          <span>Test the script</span>
                          <span className="font-mono">10 min</span>
                        </div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <div className="relative z-10 w-3 h-3 mt-1 rounded-sm bg-red-900/40 flex items-center justify-center"><LuServer className="w-2 h-2 text-red-400" /></div>
                        <div className="flex-1 text-zinc-400 text-xs">
                          <div className="flex justify-between">
                            <span className="text-red-200/80">Set up server security</span>
                            <span className="font-mono text-red-400">10 min</span>
                          </div>
                          <p className="text-red-500/50 italic mt-0.5 text-[10px]">Or skip it and lose your funds.</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Footer Impact */}
                  <div className="absolute bottom-0 left-0 right-0 border-t border-white/5 bg-zinc-900/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">The Reality</p>
                      <p className="text-xs text-white/70">Do this for each platform.</p>
                    </div>
                    <p className="text-sm text-red-400 mt-1 font-medium">Total = All your free time and peace of mind.</p>
                  </div>
                </div>
                </motion.div>

                {/* Desc 2 - Top Card (Slides in) */}
                <motion.div
                  style={{ 
                    display: descDisplay2, 
                    x: desc2X 
                  }}
                  className="absolute inset-0 z-20"
                >
                  <div className="w-full h-full relative overflow-hidden rounded-xl border border-emerald-500/30 bg-black/95 backdrop-blur-xl shadow-[0_0_50px_-10px_rgba(16,185,129,0.15)] p-6">
                  {/* Header */}
                  <div className="relative flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                      <LuZap className="w-4 h-4 fill-emerald-400/20" />
                      <span>FlowForge Automated</span>
                    </div>
                    <div className="px-2 py-1 rounded bg-emerald-950/30 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                      SPEED: OPTIMIZED
                    </div>
                  </div>
                  {/* Linear Timeline */}
                  <div className="relative pl-2 space-y-5">
                    {/* Vertical Connecting Line */}
                    <div className="absolute left-[13px] top-2 bottom-4 w-[2px] bg-linear-to-b from-emerald-500 via-emerald-600/30 to-transparent" />

                    {[
                      { title: "Login with Privy", time: "30s" },
                      { title: "Connect existing wallet", time: "10s" },
                      { title: "Set up Safe Wallet on desired chains", time: "30s" },
                      { title: "Connect Telegram", time: "30s" },
                    ].map((item, i) => (
                      <div key={i} className="relative flex items-center gap-4 group">
                        <div className="relative z-10 w-6 h-6 rounded-full bg-black border border-emerald-500/50 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        </div>
                        <div className="flex-1 flex justify-between items-center border-b border-white/5 pb-2 group-last:border-0">
                          <span className="text-zinc-200 text-sm font-medium">{item.title}</span>
                          <span className="text-emerald-500/70 font-mono text-xs bg-emerald-950/20 px-2 py-0.5 rounded">{item.time}</span>
                        </div>
                      </div>
                    ))}

                    {/* The Big Step */}
                    <div className="relative flex items-start gap-4 pt-2">
                      <div className="relative z-10 w-6 h-6 mt-1 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.6)]">
                        <LuCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="text-white text-md font-semibold leading-tight">Send a message defining conditions & action</span>
                          <span className="text-emerald-400 font-bold font-mono text-xs bg-emerald-900/30 border border-emerald-500/30 px-2 py-1 rounded">60s</span>
                        </div>
                        <p className="text-xs text-emerald-200/60 mt-2 leading-relaxed">
                          (Any number of conditions and any number of actions can be bundled)
                        </p>
                      </div>
                    </div>

                  </div>
                  {/* Footer Impact */}
                  <div className="absolute bottom-0 left-0 right-0 mt-8 pt-4 border-t border-emerald-500/20 bg-emerald-900/20 px-6 py-4 flex items-center gap-4">
                    <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-400">
                      <BiRocket className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold">Total: Under 3 Minutes</p>
                      <p className="text-sm text-white/90 font-medium leading-tight">
                        Peace of mind. Funds are safe. Action is guaranteed when conditions are met.
                      </p>
                    </div>
                  </div>
                </div>
                </motion.div>

              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}