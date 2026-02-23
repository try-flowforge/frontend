"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

// Import all protocol SVGs from assets/blocks
import aave from "@/assets/blocks/Aave.svg";
import across from "@/assets/blocks/Across.svg";
import beefy from "@/assets/blocks/Beefy.svg";
import camelot from "@/assets/blocks/Camelot.svg";
import chainlink from "@/assets/blocks/Chainlink.svg";
import chatgpt from "@/assets/blocks/ChatGPT.svg";
import compound from "@/assets/blocks/Compound.svg";
import deepseek from "@/assets/blocks/Deepseek.svg";
import defillama from "@/assets/blocks/DefiLlama.svg";
import frax from "@/assets/blocks/Frax.svg";
import gamma from "@/assets/blocks/Gamma.svg";
import glm from "@/assets/blocks/GLM.svg";
import gmx from "@/assets/blocks/GMX.svg";
import hyperliquid from "@/assets/blocks/Hyperliquid.svg";
import ifElse from "@/assets/blocks/IfElse.svg";
import insurace from "@/assets/blocks/InsurAce.svg";
import lido from "@/assets/blocks/Lido.svg";
import lifi from "@/assets/blocks/LiFi.svg";
import mail from "@/assets/blocks/Mail.svg";
import nexusmutual from "@/assets/blocks/NexusMutual.svg";
import opensea from "@/assets/blocks/OpenSea.svg";
import ostium from "@/assets/blocks/Ostium.svg";
import pendle from "@/assets/blocks/Pendle.svg";
import pyth from "@/assets/blocks/Pyth.svg";
import qwen from "@/assets/blocks/Qwen.svg";
import radiant from "@/assets/blocks/Radiant.svg";
import slack from "@/assets/blocks/Slack.svg";
import snapshot from "@/assets/blocks/Snapshot.svg";
import stargate from "@/assets/blocks/Stargate.svg";
import switchIcon from "@/assets/blocks/Switch.svg";
import tally from "@/assets/blocks/Tally.svg";
import telegram from "@/assets/blocks/Telegram.svg";
import treasure from "@/assets/blocks/Treasure.svg";
import uniswap from "@/assets/blocks/Uniswap.svg";
import wallet from "@/assets/blocks/Wallet.svg";
import yearn from "@/assets/blocks/Yearn.svg";
import zapper from "@/assets/blocks/Zapper.svg";

// Expected working protocols
const currentProtocols = [
  { name: "Telegram", icon: telegram },
  { name: "Mail", icon: mail },
  { name: "Slack", icon: slack },
  { name: "Uniswap", icon: uniswap },
  { name: "LiFi", icon: lifi },
  { name: "Aave", icon: aave },
  { name: "Compound", icon: compound },
  { name: "Wallet", icon: wallet },
  { name: "Chainlink", icon: chainlink },
  { name: "Pyth", icon: pyth },
  { name: "ChatGPT", icon: chatgpt },
  { name: "GLM", icon: glm },
  { name: "Deepseek", icon: deepseek },
  { name: "Qwen", icon: qwen },
  { name: "If/Else", icon: ifElse },
  { name: "Switch", icon: switchIcon },
];

// Future integrations
const futureProtocols = [
  { name: "Across", icon: across },
  { name: "Beefy", icon: beefy },
  { name: "Camelot", icon: camelot },
  { name: "DefiLlama", icon: defillama },
  { name: "Frax", icon: frax },
  { name: "Gamma", icon: gamma },
  { name: "GMX", icon: gmx },
  { name: "Hyperliquid", icon: hyperliquid },
  { name: "InsurAce", icon: insurace },
  { name: "Lido", icon: lido },
  { name: "Nexus Mutual", icon: nexusmutual },
  { name: "OpenSea", icon: opensea },
  { name: "Ostium", icon: ostium },
  { name: "Pendle", icon: pendle },
  { name: "Radiant", icon: radiant },
  { name: "Snapshot", icon: snapshot },
  { name: "Stargate", icon: stargate },
  { name: "Tally", icon: tally },
  { name: "Treasure", icon: treasure },
  { name: "Yearn", icon: yearn },
  { name: "Zapper", icon: zapper },
];

export function ProtocolListSection() {
  const router = useRouter();
  const [showFutureIntegrations, setShowFutureIntegrations] = useState(false);

  const bannerItems = [
    { text: "CONNECT", icon: "∞" },
    { text: "ANYTHING", icon: "∞" },
  ];

  const duplicatedItems = [...bannerItems, ...bannerItems, ...bannerItems, ...bannerItems];

  // Combine protocols based on toggle state
  const displayedProtocols = showFutureIntegrations
    ? [
      ...currentProtocols.map((p) => ({ ...p, isFuture: false })),
      ...futureProtocols.map((p) => ({ ...p, isFuture: true })),
    ]
    : currentProtocols.map((p) => ({ ...p, isFuture: false }));

  return (
    <section className="relative w-full bg-black py-24 px-8 z-30 overflow-x-hidden">
      {/* Main Title */}
      <div className="relative mb-20 w-full overflow-hidden">
        {/* Track that moves */}
        <motion.div
          className="flex w-max flex-nowrap whitespace-nowrap"
          animate={{
            x: ["0%", "-25%"],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 20,
              ease: "linear",
            },
          }}
        >
          {/* Group 1 */}
          <div className="flex min-w-full shrink-0">
            {duplicatedItems.map((item, index) => (
              <h1
                key={`marquee-a-${index}`}
                className="text-6xl md:text-8xl lg:text-9xl font-bold text-white uppercase tracking-tight flex items-center gap-3 md:gap-6 px-6 md:px-12"
              >
                <span className="text-5xl md:text-7xl lg:text-8xl text-zinc-500">
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </h1>
            ))}
          </div>

          {/* Group 2 (duplicate) */}
          <div className="flex min-w-full shrink-0" aria-hidden="true">
            {duplicatedItems.map((item, index) => (
              <h1
                key={`marquee-b-${index}`}
                className="text-6xl md:text-8xl lg:text-9xl font-bold text-white uppercase tracking-tight flex items-center gap-3 md:gap-6 px-6 md:px-12"
              >
                <span className="text-5xl md:text-7xl lg:text-8xl text-zinc-500">
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </h1>
            ))}
          </div>

          {/* Group 3 (duplicate for seamless loop) */}
          <div className="flex min-w-full shrink-0" aria-hidden="true">
            {duplicatedItems.map((item, index) => (
              <h1
                key={`marquee-c-${index}`}
                className="text-6xl md:text-8xl lg:text-9xl font-bold text-white uppercase tracking-tight flex items-center gap-3 md:gap-6 px-6 md:px-12"
              >
                <span className="text-5xl md:text-7xl lg:text-8xl text-zinc-500">
                  {item.icon}
                </span>
                <span>{item.text}</span>
              </h1>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Protocols Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-8 md:gap-12 max-w-7xl mx-auto">
        {displayedProtocols.map((protocol) => (
          <div
            key={protocol.name}
            className={`flex flex-col items-center justify-center gap-3 p-4 ${protocol.isFuture ? "opacity-50" : "hover:opacity-80 transition-opacity"
              }`}
          >
            <div className="shrink-0 w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
              <Image
                src={protocol.icon}
                alt={protocol.name}
                width={80}
                height={80}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-white text-sm md:text-base font-medium text-center">
              {protocol.name}
            </p>
          </div>
        ))}
      </div>

      {/* Toggle Button */}
      <div className="flex justify-center mt-12">
        <Button
          onClick={() => {
            if (showFutureIntegrations) {
              router.push("/automation-builder");
            } else {
              setShowFutureIntegrations(true);
            }
          }}
          variant="default"
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          {showFutureIntegrations ? "Create Automation Workflow" : "Show All Integrations"}
        </Button>
      </div>
    </section>
  );
}
