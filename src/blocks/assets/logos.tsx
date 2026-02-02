import Image from "next/image";

import telegram from "@/assets/blocks/Telegram.svg";
import mail from "@/assets/blocks/Mail.svg";
import wallet from "@/assets/blocks/Wallet.svg";
import slack from "@/assets/blocks/Slack.svg";
import start from "@/assets/blocks/Start.svg";
import ifElse from "@/assets/blocks/IfElse.svg";
import switchIcon from "@/assets/blocks/Switch.svg";
import uniswap from "@/assets/blocks/Uniswap.svg";
import relay from "@/assets/blocks/Relay.svg";
import oneinch from "@/assets/blocks/OneInch.svg";
import lifi from "@/assets/blocks/LiFi.svg";
import aave from "@/assets/blocks/Aave.svg";
import compound from "@/assets/blocks/Compound.svg";
import chainlink from "@/assets/blocks/Chainlink.svg";
import pyth from "@/assets/blocks/Pyth.svg";
import yearn from "@/assets/blocks/Yearn.svg";
import beefy from "@/assets/blocks/Beefy.svg";
import stargate from "@/assets/blocks/Stargate.svg";
import across from "@/assets/blocks/Across.svg";
import gmx from "@/assets/blocks/GMX.svg";
import hyperliquid from "@/assets/blocks/Hyperliquid.svg";
import ostium from "@/assets/blocks/Ostium.svg";
import camelot from "@/assets/blocks/Camelot.svg";
import gamma from "@/assets/blocks/Gamma.svg";
import lido from "@/assets/blocks/Lido.svg";
import pendle from "@/assets/blocks/Pendle.svg";
import frax from "@/assets/blocks/Frax.svg";
import radiant from "@/assets/blocks/Radiant.svg";
import treasure from "@/assets/blocks/Treasure.svg";
import opensea from "@/assets/blocks/OpenSea.svg";
import snapshot from "@/assets/blocks/Snapshot.svg";
import tally from "@/assets/blocks/Tally.svg";
import defillama from "@/assets/blocks/DefiLlama.svg";
import zapper from "@/assets/blocks/Zapper.svg";
import nexusmutual from "@/assets/blocks/NexusMutual.svg";
import insurace from "@/assets/blocks/InsurAce.svg";
import qwen from "@/assets/blocks/Qwen.svg";
import glm from "@/assets/blocks/GLM.svg";
import deepseek from "@/assets/blocks/Deepseek.svg";
import { TbApi } from "react-icons/tb";
import chatgpt from "@/assets/blocks/ChatGPT.svg";

export const ApiLogo = ({ className }: LogoProps) => (
  <TbApi className={`text-orange-500 ${className || ""}`} />
);

interface LogoProps {
  className?: string;
}

export const TelegramLogo = ({ className }: LogoProps) => (
  <Image
    src={telegram}
    alt="Telegram"
    className={className}
    width={32}
    height={32}
  />
);

export const MailLogo = ({ className }: LogoProps) => (
  <Image src={mail} alt="Mail" className={className} width={32} height={32} />
);

export const WalletLogo = ({ className }: LogoProps) => (
  <Image
    src={wallet}
    alt="Wallet"
    className={className}
    width={32}
    height={32}
  />
);

export const SlackLogo = ({ className }: LogoProps) => (
  <Image src={slack} alt="Slack" className={className} width={32} height={32} />
);

export const UniswapLogo = ({ className }: LogoProps) => (
  <Image
    src={uniswap}
    alt="Uniswap"
    className={className}
    width={32}
    height={32}
  />
);

export const RelayLogo = ({ className }: LogoProps) => (
  <Image src={relay} alt="Relay" className={className} width={32} height={32} />
);

export const OneInchLogo = ({ className }: LogoProps) => (
  <Image
    src={oneinch}
    alt="1inch"
    className={className}
    width={32}
    height={32}
  />
);

export const LiFiLogo = ({ className }: LogoProps) => (
  <Image src={lifi} alt="LI.FI" className={className} width={32} height={32} />
);

export const StartLogo = ({ className }: LogoProps) => (
  <Image src={start} alt="Start" className={className} width={32} height={32} />
);

export const IfElseLogo = ({ className }: LogoProps) => (
  <Image
    src={ifElse}
    alt="If/Else"
    className={className}
    width={32}
    height={32}
  />
);

export const SwitchLogo = ({ className }: LogoProps) => (
  <Image
    src={switchIcon}
    alt="Switch"
    className={className}
    width={32}
    height={32}
  />
);

export const AaveLogo = ({ className }: LogoProps) => (
  <Image src={aave} alt="Aave" className={className} width={32} height={32} />
);

export const CompoundLogo = ({ className }: LogoProps) => (
  <Image
    src={compound}
    alt="Compound"
    className={className}
    width={32}
    height={32}
  />
);

export const ChainlinkLogo = ({ className }: LogoProps) => (
  <Image
    src={chainlink}
    alt="Chainlink"
    className={className}
    width={32}
    height={32}
  />
);

export const PythLogo = ({ className }: LogoProps) => (
  <Image
    src={pyth}
    alt="Pyth Network"
    className={className}
    width={32}
    height={32}
  />
);

export const YearnLogo = ({ className }: LogoProps) => (
  <Image
    src={yearn}
    alt="Yearn Finance"
    className={className}
    width={32}
    height={32}
  />
);

export const BeefyLogo = ({ className }: LogoProps) => (
  <Image
    src={beefy}
    alt="Beefy Finance"
    className={className}
    width={32}
    height={32}
  />
);

export const StargateLogo = ({ className }: LogoProps) => (
  <Image
    src={stargate}
    alt="Stargate"
    className={className}
    width={32}
    height={32}
  />
);

export const AcrossLogo = ({ className }: LogoProps) => (
  <Image
    src={across}
    alt="Across Protocol"
    className={className}
    width={32}
    height={32}
  />
);

export const GMXLogo = ({ className }: LogoProps) => (
  <Image src={gmx} alt="GMX" className={className} width={32} height={32} />
);

export const HyperliquidLogo = ({ className }: LogoProps) => (
  <Image
    src={hyperliquid}
    alt="Hyperliquid"
    className={className}
    width={32}
    height={32}
  />
);

export const OstiumLogo = ({ className }: LogoProps) => (
  <Image
    src={ostium}
    alt="Ostium"
    className={className}
    width={32}
    height={32}
  />
);

export const CamelotLogo = ({ className }: LogoProps) => (
  <Image
    src={camelot}
    alt="Camelot"
    className={className}
    width={32}
    height={32}
  />
);

export const GammaLogo = ({ className }: LogoProps) => (
  <Image
    src={gamma}
    alt="Gamma Strategies"
    className={className}
    width={32}
    height={32}
  />
);

export const LidoLogo = ({ className }: LogoProps) => (
  <Image src={lido} alt="Lido" className={className} width={32} height={32} />
);

export const PendleLogo = ({ className }: LogoProps) => (
  <Image
    src={pendle}
    alt="Pendle"
    className={className}
    width={32}
    height={32}
  />
);

export const FraxLogo = ({ className }: LogoProps) => (
  <Image
    src={frax}
    alt="Frax Finance"
    className={className}
    width={32}
    height={32}
  />
);

export const RadiantLogo = ({ className }: LogoProps) => (
  <Image
    src={radiant}
    alt="Radiant Capital"
    className={className}
    width={32}
    height={32}
  />
);

export const TreasureLogo = ({ className }: LogoProps) => (
  <Image
    src={treasure}
    alt="Treasure DAO"
    className={className}
    width={32}
    height={32}
  />
);

export const OpenSeaLogo = ({ className }: LogoProps) => (
  <Image
    src={opensea}
    alt="OpenSea"
    className={className}
    width={32}
    height={32}
  />
);

export const SnapshotLogo = ({ className }: LogoProps) => (
  <Image
    src={snapshot}
    alt="Snapshot"
    className={className}
    width={32}
    height={32}
  />
);

export const TallyLogo = ({ className }: LogoProps) => (
  <Image src={tally} alt="Tally" className={className} width={32} height={32} />
);

export const DefiLlamaLogo = ({ className }: LogoProps) => (
  <Image
    src={defillama}
    alt="DefiLlama"
    className={className}
    width={32}
    height={32}
  />
);

export const ZapperLogo = ({ className }: LogoProps) => (
  <Image
    src={zapper}
    alt="Zapper"
    className={className}
    width={32}
    height={32}
  />
);

export const NexusMutualLogo = ({ className }: LogoProps) => (
  <Image
    src={nexusmutual}
    alt="Nexus Mutual"
    className={className}
    width={32}
    height={32}
  />
);

export const InsurAceLogo = ({ className }: LogoProps) => (
  <Image
    src={insurace}
    alt="InsurAce"
    className={className}
    width={32}
    height={32}
  />
);

export const ChatGPTLogo = ({ className }: LogoProps) => (
  <Image
    src={chatgpt}
    alt="ChatGPT"
    className={className}
    width={32}
    height={32}
  />
);

export const QwenLogo = ({ className }: LogoProps) => (
  <Image src={qwen} alt="Qwen" className={className} width={32} height={32} />
);

export const GLMLogo = ({ className }: LogoProps) => (
  <Image src={glm} alt="GLM" className={className} width={32} height={32} />
);

export const DeepSeekLogo = ({ className }: LogoProps) => (
  <Image
    src={deepseek}
    alt="DeepSeek"
    className={className}
    width={32}
    height={32}
  />
);
