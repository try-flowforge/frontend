"use client";

import { Typography } from "@/components/ui/Typography";
import { DraggableBlock } from "./DraggableBlock";
import { ComingSoonSection } from "./ComingSoonSection";
import { useWorkflow } from "@/context/WorkflowContext";
import { useBlock } from "@/blocks/context";
import type { BlockDefinition } from "@/blocks/types";

interface WorkflowBlockListProps {
  activeCategory: string;
}

// Helper function to categorize DeFi blocks
function categorizeDefiBlocks(blocks: BlockDefinition[]) {
  const swapBlocks = blocks.filter(
    (block) =>
      block.nodeType === "uniswap" ||
      block.nodeType === "lifi"
  );
  const lendingBlocks = blocks.filter(
    (block) => block.nodeType === "aave" || block.nodeType === "compound"
  );
  const perpsBlocks = blocks.filter(
    (block) => block.nodeType === "ostium"
  );
  const knownNodeTypes = new Set([
    ...swapBlocks.map((b) => b.nodeType),
    ...lendingBlocks.map((b) => b.nodeType),
    ...perpsBlocks.map((b) => b.nodeType),
  ]);
  const otherBlocks = blocks.filter((block) => !knownNodeTypes.has(block.nodeType));

  return { swapBlocks, lendingBlocks, perpsBlocks, otherBlocks };
}

export function WorkflowBlockList({
  activeCategory,
}: WorkflowBlockListProps) {
  const {
    handleBlockDragStart,
    handleBlockClick,
    isBlockDisabled,
  } = useWorkflow();
  const { getCategories } = useBlock();
  const blockCategories = getCategories();

  // Handle Coming Soon category
  if (activeCategory === "coming-soon") {
    return (
      <div
        className="w-[95%] mx-auto h-[80vh] overflow-y-auto scrollbar-hide mt-5"
        data-lenis-prevent
      >
        <ComingSoonSection />
      </div>
    );
  }

  // Get categories to display
  const categoriesToDisplay =
    activeCategory === "all"
      ? blockCategories
      : blockCategories.filter((cat) => cat.id === activeCategory);

  return (
    <div
      className="w-[95%] mx-auto h-[90vh] overflow-y-auto scrollbar-hide mt-5"
      data-lenis-prevent
    >
      {/* Blocks Section - Grouped by category */}
      {categoriesToDisplay.length > 0 && (
        <div className="space-y-6">
          {categoriesToDisplay.map((category) => {
            const categoryBlocks = category.blocks;

            if (categoryBlocks.length === 0) return null;

            // Special handling for DeFi category - split into Swap and Lending
            if (category.id === "defi") {
              const { swapBlocks, lendingBlocks, perpsBlocks, otherBlocks } = categorizeDefiBlocks(categoryBlocks);

              return (
                <div key={category.id} className="space-y-6">
                  {/* Swap Section */}
                  {swapBlocks.length > 0 && (
                    <div className="space-y-3">
                      <div className="px-1">
                        <Typography
                          variant="caption"
                          className="text-xs font-semibold text-white/70 uppercase tracking-wider"
                        >
                          Swap
                        </Typography>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {swapBlocks.map((block) => {
                          const disabled = isBlockDisabled(block.id);
                          return (
                            <DraggableBlock
                              key={block.id}
                              block={block}
                              onDragStart={handleBlockDragStart}
                              onClick={handleBlockClick}
                              disabled={disabled}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lending & Borrowing Section */}
                  {lendingBlocks.length > 0 && (
                    <div className="space-y-3">
                      <div className="px-1">
                        <Typography
                          variant="caption"
                          className="text-xs font-semibold text-white/70 uppercase tracking-wider"
                        >
                          Lending & Borrowing
                        </Typography>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {lendingBlocks.map((block) => {
                          const disabled = isBlockDisabled(block.id);
                          return (
                            <DraggableBlock
                              key={block.id}
                              block={block}
                              onDragStart={handleBlockDragStart}
                              onClick={handleBlockClick}
                              disabled={disabled}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Perpetuals Section */}
                  {perpsBlocks.length > 0 && (
                    <div className="space-y-3">
                      <div className="px-1">
                        <Typography
                          variant="caption"
                          className="text-xs font-semibold text-white/70 uppercase tracking-wider"
                        >
                          Perpetuals
                        </Typography>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {perpsBlocks.map((block) => {
                          const disabled = isBlockDisabled(block.id);
                          return (
                            <DraggableBlock
                              key={block.id}
                              block={block}
                              onDragStart={handleBlockDragStart}
                              onClick={handleBlockClick}
                              disabled={disabled}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fallback for additional DeFi blocks */}
                  {otherBlocks.length > 0 && (
                    <div className="space-y-3">
                      <div className="px-1">
                        <Typography
                          variant="caption"
                          className="text-xs font-semibold text-white/70 uppercase tracking-wider"
                        >
                          Other
                        </Typography>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {otherBlocks.map((block) => {
                          const disabled = isBlockDisabled(block.id);
                          return (
                            <DraggableBlock
                              key={block.id}
                              block={block}
                              onDragStart={handleBlockDragStart}
                              onClick={handleBlockClick}
                              disabled={disabled}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Regular category display
            return (
              <div key={category.id} className="space-y-3">
                {/* Category Header */}
                <div className="px-1">
                  <Typography
                    variant="caption"
                    className="text-xs font-semibold text-white/70 uppercase tracking-wider"
                  >
                    {category.label}
                  </Typography>
                </div>

                {/* Blocks Grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  {categoryBlocks.map((block) => {
                    const disabled = isBlockDisabled(block.id);

                    return (
                      <DraggableBlock
                        key={block.id}
                        block={block}
                        onDragStart={handleBlockDragStart}
                        onClick={handleBlockClick}
                        disabled={disabled}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {categoriesToDisplay.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-2 text-center">
          <Typography
            variant="caption"
            className="text-muted-foreground text-xs"
          >
            No blocks
          </Typography>
        </div>
      )}

      {/* Divider */}
      <div className="my-6 border-t border-white/10" />

      {/* Coming Soon Section - Always show at bottom */}
      <ComingSoonSection />
    </div>
  );
}
