# Block System Documentation

This directory contains the core logic for the block system in the application. It is designed to be modular and convention-based.

## Directory Structure

*   **`definitions/`**: Contains the pure logic and metadata for each block (the "Truth").
*   **`configs/`**: Contains React components for the *configuration panel* (right sidebar).
*   **`nodes/`**: Contains React components for *canvas visualization*.
*   **`assets/`**: Stores static assets like logos.
*   **`registry.ts`**: Central registry handling static imports and auto-discovery.

---

## Strict Conventions & Rules (CRITICAL)

**Follow these rules exactly.** The system relies on rigid naming conventions to auto-wire components.

### 1. Naming Conventions

| Component | File Naming | Export Name | Example |
| :--- | :--- | :--- | :--- |
| **Block Definition** | `kebab-case.ts` (or `lower.ts`) | `const xyzBlock` | `definitions/social/telegram.ts` |
| **Config Component** | `PascalCaseConfiguration.tsx` | `XyzNodeConfiguration` | `configs/social/telegram/TelegramNodeConfiguration.tsx` |
| **Canvas Node** | `PascalCaseNode.tsx` | `XyzNode` | `nodes/TelegramNode.tsx` |
| **Block ID** | `kebab-case` | (inside definition) | `"telegram"`, `"ai-transform"` |

### 2. ID & Type Transformation Logic

The `registry.ts` contains helper functions that strictly transform names. If you deviate, the auto-wiring **WILL FAIL**.

*   **`filenameToBlockId`**:
    *   **Rule**: `filename.replace(/\.(ts|tsx)$/, "").toLowerCase()`
    *   **Input**: `MyBlock.ts` -> **Output**: `myblock`
    *   **Input**: `my-block.ts` -> **Output**: `my-block` (Preferred)

*   **`componentNameToBlockId`**:
    *   **Rule**: Removes `Node`, `Configuration`, `Config` types from the end. Converts CamelCase to kebab-case.
    *   **Input**: `TelegramNodeConfiguration` -> `Telegram` -> `telegram`
    *   **Input**: `AiTransformConfig` -> `AiTransform` -> `ai-transform`

*   **`blockIdToBackendType`**:
    *   **Rule**: Uppercase, replaces `-` with `_`.
    *   **Input**: `ai-transform` -> **Output**: `AI_TRANSFORM`

### 3. File Location Rules

*   **Definitions**: Must be in `src/blocks/definitions/<category>/<block-id>.ts`.
*   **Configs**: MUST be in `src/blocks/configs/<category>/<block-id>/<BlockPascal>NodeConfiguration.tsx`.
    *   *Note*: The registry might look for `*Config.tsx` in strict regex mode, but for organizational clarity, follow the existing pattern of creating a subfolder if the config is complex.
*   **Nodes**: Must be in `src/blocks/nodes/<BlockPascal>Node.tsx`.

---

## Step-by-Step Implementation Guide

### Phase 1: The Definition (The Source of Truth)
Create `src/blocks/definitions/<category>/<id>.ts`.

```typescript
// src/blocks/definitions/social/discord.ts
import type { BlockDefinition } from "../../types";

export const discordBlock: BlockDefinition = {
  id: "discord",
  label: "Discord",
  iconName: "DiscordLogo", // Must match export in assets/logos
  category: "social",
  nodeType: "discord",     // Should match id usually
  backendType: "DISCORD",  // explicit backend enum mapping
  
  // Define the shape of data this node holds
  defaultData: {
    label: "Discord",
    webhookUrl: "",
  },
};
```

### Phase 2: The Configuration
Create `src/blocks/configs/social/discord/DiscordNodeConfiguration.tsx`.

**Crucial Rules for Configs:**
1.  Props must match `NodeConfigurationProps`.
2.  Use `handleDataChange` to update local state.
3.  **DO NOT** rely on global context inside the form for basic fields; pass them down via `nodeData`.

```tsx
import { NodeConfigurationProps } from "../../../types";
import { FormInput } from "@/components/ui/FormInput";

export const DiscordNodeConfiguration = ({ nodeData, handleDataChange }: NodeConfigurationProps) => {
  return (
    <div className="space-y-4">
      <FormInput
        label="Webhook URL"
        value={nodeData.webhookUrl as string || ""}
        onChange={(val) => handleDataChange({ webhookUrl: val })}
      />
    </div>
  );
};
```

### Phase 3: Registration (The Wiring)

To ensure the block is recognized:

1.  **Registry (`src/blocks/registry.ts`)**:
    *   **Import the definition**: `import { discordBlock } from "./definitions/social/discord";`
    *   **Add to explicit list**: Add `discordBlock` to the `STATIC_BLOCKS` array.
2.  **Logos**:
    *   Add your logo export to `src/blocks/assets/logos.tsx` (or index.ts).
    *   **CRITICAL**: You MUST add the logo to the `logoMap` object inside the `generateIconRegistry()` function in `src/blocks/registry.ts`.
    *   Example: `DiscordLogo: logos.DiscordLogo,`
3.  **Category Labels**:
    *   If you used a new category (e.g., "social"), ensure it has a proper label in the `getCategoryLabel()` function in `src/blocks/registry.ts`.
    *   Example: `social: "Social Media",`

---

## Checklists for AI Agents & Developers

### ✅ Pre-Commit Checklist
- [ ] **ID Consistency**: Does `id` in definition match the filename (kebab-case)?
- [ ] **Backend Mapping**: Is `backendType` upper-snake-case version of the ID?
- [ ] **Unique Keys**: Is the `id` globally unique across all categories?
- [ ] **Icon Match**: Does `iconName` exactly match a named export in `assets/logos`?
- [ ] **Hidden Blocks**: If the block shouldn't be in the picker (like Start), is `hidden: true` set?

### ❌ Common Pitfalls (DO NOT DO)
- **Do not** use `any` in `nodeData`. Define an interface for your block's data.
- **Do not** hardcode backend URLs in the config component.
- **Do not** create a new category string without updating the `CategoryDefinition` type/logic if strict typing is enforced.
- **Do not** forget to register the block in `STATIC_BLOCKS`. While auto-discovery exists, static registration is safer for production builds.

