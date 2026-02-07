"use client";

import { ArrowDownRight, MoveUpRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Image, { type StaticImageData } from "next/image";
import { motion, useTransform, MotionValue } from "framer-motion";

import d1 from "@/assets/homepage/solution-section/design/1d.png"
import d2 from "@/assets/homepage/solution-section/design/2d.png"
import d3 from "@/assets/homepage/solution-section/design/3d.png"
import d4 from "@/assets/homepage/solution-section/design/4d.png"

import c1 from "@/assets/homepage/solution-section/connect/1c.png"
import c2 from "@/assets/homepage/solution-section/connect/2c.png"
import c3 from "@/assets/homepage/solution-section/connect/3c.png"

import a1 from "@/assets/homepage/solution-section/automate/1a.png"
import a2 from "@/assets/homepage/solution-section/automate/2a.png"
import a3 from "@/assets/homepage/solution-section/automate/3a.png"
import a4 from "@/assets/homepage/solution-section/automate/4a.png"
import a5 from "@/assets/homepage/solution-section/automate/5a.png"
import a6 from "@/assets/homepage/solution-section/automate/6a.png"


import r1 from "@/assets/homepage/solution-section/run/1r.png"
import r2 from "@/assets/homepage/solution-section/run/2r.png"
import r3 from "@/assets/homepage/solution-section/run/3r.png"
import r4 from "@/assets/homepage/solution-section/run/4r.png"
import r5 from "@/assets/homepage/solution-section/run/5r.png"
import r6 from "@/assets/homepage/solution-section/run/6r.png"

import t1 from "@/assets/homepage/solution-section/trigger/1t.png"
import t2 from "@/assets/homepage/solution-section/trigger/2t.png"
import t3 from "@/assets/homepage/solution-section/trigger/3t.png"

import s1 from "@/assets/homepage/solution-section/ship/1s.png"
import s2 from "@/assets/homepage/solution-section/ship/2s.png"
import s3 from "@/assets/homepage/solution-section/ship/3s.png"
import s4 from "@/assets/homepage/solution-section/ship/4s.png"
import s5 from "@/assets/homepage/solution-section/ship/5s.png"
import s6 from "@/assets/homepage/solution-section/ship/6s.png"

const SOLUTION_STORY = [
  {
    word: "Design",
    label: "No code",
    imagePrompts: [
      "Visual workflow canvas with drag-and-drop blocks, clean UI, modern app builder, soft shadows",
      "No-code editor with nodes and connections, minimalist, light background",
      "Hand drawing or arranging workflow blocks on a digital canvas, isometric or flat design",
    ],
  },
  {
    word: "Connect",
    label: undefined,
    imagePrompts: [
      "Connected nodes and APIs, integration diagram, links between services, tech illustration",
      "Plug-and-play connectors or cables linking blocks, simple geometric style",
      "Network of apps and data sources unified in one hub, abstract minimal",
    ],
  },
  {
    word: "Automate",
    label: undefined,
    imagePrompts: [
      "Workflow running on its own, gears and flow arrows, automation in motion",
      "Hands-free execution, robot or clock symbol, set-it-and-forget-it vibe",
      "Pipeline or conveyor of tasks completing automatically, clean infographic style",
    ],
  },
  {
    word: "Trigger",
    label: undefined,
    imagePrompts: [
      "Clock, calendar, webhook icon—when this then that, event-driven concept",
      "Button or switch that starts a chain reaction, minimal product shot",
      "Spark or lightning triggering a sequence of blocks, abstract tech",
    ],
  },
  {
    word: "Run",
    label: "Always on",
    imagePrompts: [
      "Workflow execution in progress, play state, live indicator, dashboard feel",
      "Reliable always-on system, uptime or heartbeat, minimal iconography",
      "Success state or completion check, clean and reassuring visual",
    ],
  },
  {
    word: "Ship",
    label: undefined,
    imagePrompts: [
      "One-click deploy or launch, rocket or release, product shipping moment",
      "From build to production, arrow or path from dev to live",
      "Scaling up or going live, growth curve or ramp, simple graphic",
    ],
  },
] as const;

type FunctionalitySectionProps = {
  progress: MotionValue<number>;
};

const RevealRow = ({
  children,
  x,
  scale,
  scroll,
}: {
  children: React.ReactNode;
  x: MotionValue<string>;
  scale: MotionValue<number>;
  scroll: MotionValue<string>;
}) => {
  return (
    <div className="relative w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
      <motion.div
        style={{ scale }}
        className="origin-left will-change-transform"
      >
        <motion.div
          style={{ x: scroll }}
          className="flex w-max items-start gap-4 will-change-transform"
        >
          {children}
        </motion.div>
      </motion.div>

      {/* The Black Curtain Overlay */}
      <motion.div
        style={{ x }}
        className="absolute inset-0 bg-black z-20 will-change-transform pointer-events-none"
      />
    </div>
  );
};
const MediaCard = ({
  src,
  className,
  label,
  alt,
}: {
  src: string | StaticImageData;
  className?: string;
  label?: string;
  alt?: string;
}) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl bg-neutral-200 shrink-0 h-full w-[150px] md:w-[260px]",
      className
    )}
  >
    <Image
      src={src}
      width={260}
      height={160}
      alt={alt ?? "Solution story visual"}
      className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 ease-out"
    />
    {label && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <span className="text-white font-bold text-lg md:text-xl tracking-wide">
          {label}
        </span>
      </div>
    )}
  </div>
);

export function FunctionalitySection({ progress }: FunctionalitySectionProps) {
  const row1X = useTransform(
    progress,
    [0, 0.2, 0.25, 0.55],
    ["0%", "-30%", "-40%", "-100%"]
  );
  const row1Scale = useTransform(progress, [0, 0.7], [1.2, 1]);
  // Initial scroll animation, then continue scrolling horizontally after 0.58
  const row1Scroll = useTransform(
    progress,
    [0, 0.54, 0.58, 1],
    ["10%", "0%", "0%", "-10%"]
  );

  // Row 2: Starts slightly later (0.1 -> 0.40)
  const row2X = useTransform(
    progress,
    [0, 0.2, 0.3, 0.6],
    ["0%", "-50%", "-60%", "-100%"]
  );
  const row2Scale = useTransform(progress, [0, 0.7], [1.2, 1]);
  // Initial scroll animation, then continue scrolling horizontally after 0.58
  const row2Scroll = useTransform(
    progress,
    [0, 0.58, 1],
    ["12%", "0%", "-5%"]
  );

  // Row 3: Slow reveal (0.05 -> 0.50)
  const row3X = useTransform(
    progress,
    [0, 0.2, 0.4, 0.49],
    ["0%", "-60%", "-80%", "-100%"]
  );
  const row3Scale = useTransform(progress, [0, 0.7], [1.3, 1]);
  // Initial scroll animation, then continue scrolling horizontally after 0.58
  const row3Scroll = useTransform(
    progress,
    [0, 0.45, 0.58, 1],
    ["18%", "0%", "0%", "-15%"]
  );

  // Row 4: Fast middle reveal (0.20 -> 0.45)
  const row4X = useTransform(
    progress,
    [0, 0.1, 0.4, 0.52],
    ["0%", "-45%", "-70%", "-100%"]
  );
  const row4Scale = useTransform(progress, [0, 0.7], [1.2, 1]);
  // Initial scroll animation, then continue scrolling horizontally after 0.58
  const row4Scroll = useTransform(
    progress,
    [0, 0.5, 0.58, 1],
    ["10%", "0%", "0%", "0%"]
  );

  // Row 5: Late start (0.30 -> 0.60)
  const row5X = useTransform(
    progress,
    [0, 0.2, 0.5, 0.6],
    ["0%", "-55%", "-68%", "-100%"]
  );
  const row5Scale = useTransform(progress, [0, 0.7], [1.3, 1]);
  // Initial scroll animation, then continue scrolling horizontally after 0.58
  const row5Scroll = useTransform(
    progress,
    [0, 0.57, 0.58, 1],
    ["20%", "0%", "0%", "-20%"]
  );

  // Row 6: Last to finish (0.40 -> 0.85)
  const row6X = useTransform(
    progress,
    [0, 0.2, 0.3, 0.5],
    ["0%", "-20%", "-73%", "-100%"]
  );
  const row6Scale = useTransform(progress, [0, 0.7], [1.3, 1]);
  // Initial scroll animation, then continue scrolling horizontally after 0.58
  const row6Scroll = useTransform(
    progress,
    [0, 0.48, 0.58, 1],
    ["30%", "0%", "0%", "-10%"]
  );

  return (
    <div className="h-full w-full flex flex-col items-center justify-center overflow-hidden bg-white">
      {/* Story: Design → Connect → Automate → Trigger → Run → Ship */}
      <RevealRow x={row1X} scale={row1Scale} scroll={row1Scroll}>
        <div className="flex items-start justify-center h-[17vh] gap-4 w-full py-3">
          <MediaCard src={d1} alt={SOLUTION_STORY[0].imagePrompts[0]} />
          <MediaCard src={d4} className="md:w-[200px]" alt={SOLUTION_STORY[0].imagePrompts[1]} />
          <MediaCard src={d3} alt={SOLUTION_STORY[0].imagePrompts[2]} />
          <h2 className="text-7xl md:text-9xl font-bold tracking-tight leading-none shrink-0 text-black uppercase select-none">
            {SOLUTION_STORY[0].word}
          </h2>
          <ArrowDownRight className="w-16 h-16 md:w-36 md:h-36 text-black shrink-0 stroke-[1.5]" />
          <MediaCard src={d1} alt={SOLUTION_STORY[0].imagePrompts[0]} />
          <MediaCard src={d2} alt={SOLUTION_STORY[0].imagePrompts[1]} />
          <MediaCard src={d3} alt={SOLUTION_STORY[0].imagePrompts[2]} />
        </div>
      </RevealRow>

      <RevealRow x={row2X} scale={row2Scale} scroll={row2Scroll}>
        <div className="flex items-start justify-center h-[17vh] gap-4 w-full py-3">
          <MediaCard src={c1} alt={SOLUTION_STORY[1].imagePrompts[0]} />
          <MediaCard src={c2} alt={SOLUTION_STORY[1].imagePrompts[1]} />
          <MediaCard src={c3} alt={SOLUTION_STORY[1].imagePrompts[2]} />
          <h2 className="text-7xl md:text-9xl font-bold tracking-tight leading-none shrink-0 text-black uppercase select-none">
            {SOLUTION_STORY[1].word}
          </h2>
          <div className="w-16 h-16 md:w-32 md:h-32 rounded-full bg-black shrink-0" />
          <MediaCard src={c1} alt={SOLUTION_STORY[1].imagePrompts[0]} />
          <MediaCard src={c2} alt={SOLUTION_STORY[1].imagePrompts[1]} />
        </div>
      </RevealRow>

      <RevealRow x={row3X} scale={row3Scale} scroll={row3Scroll}>
        <div className="flex items-start justify-center h-[17vh] gap-4 w-full py-3">
          <MediaCard src={a5} alt={SOLUTION_STORY[2].imagePrompts[0]} />
          <MediaCard src={a2} alt={SOLUTION_STORY[2].imagePrompts[1]} />
          <MediaCard src={a3} alt={SOLUTION_STORY[2].imagePrompts[2]} />
          <h2 className="text-7xl md:text-9xl font-bold tracking-tight leading-none shrink-0 text-black uppercase select-none">
            {SOLUTION_STORY[2].word}
          </h2>
          <MediaCard src={a4} alt={SOLUTION_STORY[2].imagePrompts[0]} />
          <MediaCard src={a1} className="md:w-[200px]" alt={SOLUTION_STORY[2].imagePrompts[2]} />
          <MediaCard src={a6} alt={SOLUTION_STORY[2].imagePrompts[1]} />
        </div>
      </RevealRow>

      <RevealRow x={row4X} scale={row4Scale} scroll={row4Scroll}>
        <div className="flex items-start justify-center h-[17vh] gap-4 w-full py-3">
          <MediaCard src={t1} alt={SOLUTION_STORY[3].imagePrompts[0]} />
          <div className="w-10 h-10 md:w-20 md:h-20 border-[6px] border-black shrink-0" />
          <h2 className="text-7xl md:text-9xl font-bold tracking-tight leading-none shrink-0 text-black uppercase select-none">
            {SOLUTION_STORY[3].word}
          </h2>
          <div className="shrink-0 h-full w-[180px] md:w-[300px] rounded-2xl bg-linear-to-tr from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
            <div className="grid grid-cols-6 gap-2 opacity-50">
              {[...Array(24)].map((_, i) => (
                <div key={i} className="w-1 h-1 bg-white rounded-full" />
              ))}
            </div>
          </div>
          <MediaCard src={t2} alt={SOLUTION_STORY[3].imagePrompts[0]} />
          <MediaCard src={t3} alt={SOLUTION_STORY[3].imagePrompts[1]} />
        </div>
      </RevealRow>

      <RevealRow x={row5X} scale={row5Scale} scroll={row5Scroll}>
        <div className="flex items-start justify-center h-[17vh] gap-4 w-full py-3">
          <MediaCard src={r1} alt={SOLUTION_STORY[4].imagePrompts[0]} />
          <MediaCard src={r2} alt={SOLUTION_STORY[4].imagePrompts[1]} />
          <MediaCard src={r3} alt={SOLUTION_STORY[4].imagePrompts[2]} />
          <MediaCard src={r4} alt={SOLUTION_STORY[4].imagePrompts[0]} />
          <h2 className="text-7xl md:text-9xl font-bold tracking-tight leading-none shrink-0 text-black uppercase select-none">
            {SOLUTION_STORY[4].word}
          </h2>
          <Play className="w-16 h-16 md:w-32 md:h-32 text-black fill-black shrink-0 ml-2" />
          <MediaCard src={r5} alt={SOLUTION_STORY[4].imagePrompts[0]} />
          <MediaCard src={r6} alt={SOLUTION_STORY[4].imagePrompts[1]} />
          <MediaCard src={r1} className="md:w-[200px]" alt={SOLUTION_STORY[4].imagePrompts[2]} />
        </div>
      </RevealRow>

      <RevealRow x={row6X} scale={row6Scale} scroll={row6Scroll}>
        <div className="flex items-start justify-center h-[17vh] gap-4 w-full py-3">
          <MediaCard src={s1} alt={SOLUTION_STORY[5].imagePrompts[0]} />
          <MediaCard src={s5} alt={SOLUTION_STORY[5].imagePrompts[1]} />
          <MediaCard src={s3} alt={SOLUTION_STORY[5].imagePrompts[2]} />
          <h2 className="text-7xl md:text-9xl font-bold tracking-tight leading-none shrink-0 text-black uppercase select-none">
            {SOLUTION_STORY[5].word}
          </h2>
          <MoveUpRight className="w-16 h-16 md:w-36 md:h-36 text-black shrink-0 stroke-[1.5]" />
          <MediaCard src={s2} alt={SOLUTION_STORY[5].imagePrompts[0]} />
          <MediaCard src={s4} className="md:w-[200px]" alt={SOLUTION_STORY[5].imagePrompts[1]} />
          <MediaCard src={s6} alt={SOLUTION_STORY[5].imagePrompts[2]} />
        </div>
      </RevealRow>
    </div>
  );
}
