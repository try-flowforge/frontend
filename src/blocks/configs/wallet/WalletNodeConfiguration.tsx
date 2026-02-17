"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthenticationStatus } from "@/components/workspace/AuthenticationStatus";
import { useSafeWalletContext } from "@/context/SafeWalletContext";
import { useOnboarding } from "@/onboarding/context/OnboardingContext";
import { ChainInfo, getAllChains } from "@/web3/config/chain-registry";
import { WalletCreationFlowCard } from "./components/WalletCreationFlowCard";
import { WalletModuleStatusCard } from "./components/WalletModuleStatusCard";
import { WalletNetworkSelectionCard } from "./components/WalletNetworkSelectionCard";
import { WalletSafeInfoCard } from "./components/WalletSafeInfoCard";
import { WalletFundingCard } from "./components/WalletFundingCard";
import { WalletSetupProgressCard } from "./components/WalletSetupProgressCard";
import {
  getChainProgress,
  isChainSetupComplete,
} from "./components/walletSetupUtils";

function WalletNodeConfigurationInner() {
  const { wallets } = useWallets();
  const { authenticated } = usePrivy();
  const linkedWallets = wallets.filter(
    (wallet) => wallet.linked || wallet.walletClientType === "privy",
  );
  const primaryWallet =
    linkedWallets.find((wallet) => wallet.walletClientType !== "privy") ||
    linkedWallets.find((wallet) => wallet.walletClientType === "privy");
  const isConnected = authenticated && primaryWallet !== undefined;
  const address = primaryWallet?.address;

  const { selection, creation } = useSafeWalletContext();
  const {
    chainsToSetup,
    progress,
    isOnboarding,
    isCheckingUser,
    currentSigningChain,
    setSelectedChains,
    saveUserChains,
    startOnboarding,
    retryChain,
  } = useOnboarding();

  const availableChains = useMemo<ChainInfo[]>(() => getAllChains(), []);
  const [selectedChainIds, setSelectedChainIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSavingChains, setIsSavingChains] = useState(false);
  const hasRefreshedAfterSetupRef = useRef(false);
  const hasAutoCollapsedSetupRef = useRef(false);
  const [isSetupExpanded, setIsSetupExpanded] = useState(true);

  useEffect(() => {
    setSelectedChainIds(new Set(chainsToSetup.map((chain) => chain.id)));
  }, [chainsToSetup]);

  const savedChainIds = useMemo(
    () => new Set(chainsToSetup.map((chain) => chain.id)),
    [chainsToSetup],
  );

  const hasUnsavedChainSelection = useMemo(() => {
    if (savedChainIds.size !== selectedChainIds.size) {
      return true;
    }

    for (const chainId of selectedChainIds) {
      if (!savedChainIds.has(chainId)) {
        return true;
      }
    }

    return false;
  }, [savedChainIds, selectedChainIds]);

  const allChainsReady = useMemo(() => {
    if (chainsToSetup.length === 0) {
      return false;
    }

    return chainsToSetup.every((chain) =>
      isChainSetupComplete(getChainProgress(progress, chain.id)),
    );
  }, [chainsToSetup, progress]);

  const readyChainCount = useMemo(
    () =>
      chainsToSetup.filter((chain) =>
        isChainSetupComplete(getChainProgress(progress, chain.id)),
      ).length,
    [chainsToSetup, progress],
  );

  const currentSigningChainName = useMemo(() => {
    if (!currentSigningChain) {
      return null;
    }

    const chain = chainsToSetup.find(
      (item) =>
        item.id === currentSigningChain ||
        String(item.chainId) === currentSigningChain,
    );

    return chain?.name || null;
  }, [chainsToSetup, currentSigningChain]);

  useEffect(() => {
    if (isOnboarding) {
      hasRefreshedAfterSetupRef.current = false;
      return;
    }

    if (!allChainsReady || hasRefreshedAfterSetupRef.current) {
      return;
    }

    hasRefreshedAfterSetupRef.current = true;
    void selection.refreshSafeList();
    void selection.refreshModuleStatus();
  }, [allChainsReady, isOnboarding, selection]);

  useEffect(() => {
    if (isOnboarding) {
      setIsSetupExpanded(true);
      hasAutoCollapsedSetupRef.current = false;
      return;
    }

    if (allChainsReady && !hasAutoCollapsedSetupRef.current) {
      setIsSetupExpanded(false);
      hasAutoCollapsedSetupRef.current = true;
      return;
    }

    if (!allChainsReady) {
      hasAutoCollapsedSetupRef.current = false;
    }
  }, [allChainsReady, isOnboarding]);

  const toggleChain = useCallback((chainId: string) => {
    setSelectedChainIds((previous) => {
      const next = new Set(previous);
      if (next.has(chainId)) {
        next.delete(chainId);
      } else {
        next.add(chainId);
      }
      return next;
    });
  }, []);

  const saveChainSelection = useCallback(async () => {
    if (selectedChainIds.size === 0) {
      return;
    }

    setIsSavingChains(true);
    try {
      const selectedChains = availableChains.filter((chain) =>
        selectedChainIds.has(chain.id),
      );
      setSelectedChains(selectedChains);
      await saveUserChains(selectedChains.map((chain) => chain.id));
    } finally {
      setIsSavingChains(false);
    }
  }, [availableChains, saveUserChains, selectedChainIds, setSelectedChains]);

  const runChainSetup = useCallback(async () => {
    if (hasUnsavedChainSelection || chainsToSetup.length === 0) {
      return;
    }
    await startOnboarding();
  }, [chainsToSetup.length, hasUnsavedChainSelection, startOnboarding]);

  if (!isConnected) {
    return <AuthenticationStatus />;
  }

  return (
    <div className="space-y-4">
      <WalletNetworkSelectionCard
        availableChains={availableChains}
        selectedChainIds={selectedChainIds}
        isCheckingUser={isCheckingUser}
        isSavingChains={isSavingChains}
        hasUnsavedChainSelection={hasUnsavedChainSelection}
        onToggleChain={toggleChain}
        onSaveSelection={() => void saveChainSelection()}
      />

      <WalletSetupProgressCard
        chainsToSetup={chainsToSetup}
        progress={progress}
        isOnboarding={isOnboarding}
        currentSigningChainName={currentSigningChainName}
        isSetupExpanded={isSetupExpanded}
        readyChainCount={readyChainCount}
        allChainsReady={allChainsReady}
        hasUnsavedChainSelection={hasUnsavedChainSelection}
        isSavingChains={isSavingChains}
        onToggleExpanded={() => setIsSetupExpanded((previous) => !previous)}
        onRetryChain={(chainId) => void retryChain(chainId)}
        onRunSetup={() => void runChainSetup()}
      />

      <WalletSafeInfoCard address={address} selection={selection} />

      <WalletFundingCard selection={selection} />

      {selection.selectedSafe && (
        <WalletModuleStatusCard selection={selection} />
      )}

      {creation.showCreateFlow && (
        <WalletCreationFlowCard creation={creation} />
      )}
    </div>
  );
}

export function WalletNodeConfiguration() {
  return (
    <ErrorBoundary>
      <WalletNodeConfigurationInner />
    </ErrorBoundary>
  );
}
