import { useState, useEffect } from "react";
import { useOnboarding } from "@/onboarding/context/OnboardingContext";
import { Button } from "@/components/ui/Button";
import { getAllChains, ChainInfo } from "@/web3/config/chain-registry";
import { FaCheck, FaLayerGroup } from "react-icons/fa";
import { StepHelpSection } from "../StepHelpSection";

export function ChainSelectionStep() {
    const {
        setSelectedChains,
        saveUserChains,
        completeStep
    } = useOnboarding();

    const [availableChains, setAvailableChains] = useState<ChainInfo[]>([]);
    const [selectedChainIds, setSelectedChainIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    // Initialize available chains
    useEffect(() => {
        const chains = getAllChains();
        setAvailableChains(chains);
        // Default select all
        const allIds = new Set(chains.map(c => c.id));
        setSelectedChainIds(allIds);
    }, []);

    const toggleChain = (chainId: string) => {
        const next = new Set(selectedChainIds);
        if (next.has(chainId)) {
            next.delete(chainId);
        } else {
            next.add(chainId);
        }
        setSelectedChainIds(next);
    };

    const handleContinue = async () => {
        if (selectedChainIds.size === 0) return;
        setIsSaving(true);
        try {
            const selected = availableChains.filter(c => selectedChainIds.has(c.id));
            setSelectedChains(selected);
            await saveUserChains(Array.from(selectedChainIds));
            completeStep("chain");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full h-full">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <FaLayerGroup className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                    Select a Supported Network
                </h3>
                <p className="text-sm text-muted-foreground max-w-lg">
                    Deploy and manage automated workflows across your preferred blockchain ecosystems.
                </p>
            </div>

            <div className="w-full flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-thin" data-lenis-prevent>
                {availableChains.map((chain) => {
                    const isSelected = selectedChainIds.has(chain.id);
                    return (
                        <div
                            key={chain.id}
                            onClick={() => toggleChain(chain.id)}
                            className={`
                                group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200
                                ${isSelected
                                    ? "border-[#f97316] bg-[#f97316]/10"
                                    : "border-white/10 hover:border-[#f97316]/50 bg-white/5 hover:bg-white/10"
                                }
                            `}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium text-foreground group-hover:text-[#f97316] transition-colors">
                                    {chain.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {chain.isTestnet ? "Testnet" : "Mainnet"}
                                </span>
                            </div>

                            <div className={`
                                w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200
                                ${isSelected
                                    ? "bg-[#f97316] border-[#f97316] text-black"
                                    : "border-white/20 bg-transparent"
                                }
                            `}>
                                {isSelected && <FaCheck className="w-3 h-3" />}
                            </div>
                        </div>
                    );
                })}
            </div>

            <StepHelpSection
                items={[
                    { text: "You can add more networks later from the Wallet section on the canvas.", type: "warning" },
                    { text: "Use the mainnet network when automating real assets or live transactions.", type: "warning" },
                    { text: "Testnets are free to use and ideal for testing your automation strategies." },
                    { text: "You don't need any native tokens for set-up, all gas fees are covered by the platform." },
                ]}
            />

            <Button
                onClick={handleContinue}
                disabled={selectedChainIds.size === 0 || isSaving}
                className="w-full h-12 text-base mt-auto bg-transparent hover:bg-white/5"
            >
                {isSaving ? "Saving..." : `Continue with ${selectedChainIds.size} Network${selectedChainIds.size !== 1 ? 's' : ''}`}
            </Button>
        </div>
    );
}
