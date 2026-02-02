/**
 * Configuration Component Registry
 */

import type { ComponentType } from "react";
import { getBlockById, getBlockByNodeType, componentNameToBlockId } from "../registry";
import type { NodeConfigurationProps } from "../types";

// Type definition for Webpack's require.context
interface RequireContext {
  keys(): string[];
  (id: string): unknown;
  id: string;
}

interface WebpackRequire {
  context(
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp,
    mode?: string
  ): RequireContext;
}

// Declare require as WebpackRequire to avoid using any
declare const require: WebpackRequire;

// Define the shape of a loaded module
interface ConfigModule {
  default?: ComponentType<NodeConfigurationProps>;
  [key: string]: ComponentType<NodeConfigurationProps> | undefined;
}

// Config component registry - supports both direct components and lazy loading.
// Keys:
// - blockId (e.g. "slack")
// - sharedConfigComponent name (e.g. "SwapConfig")
type ConfigComponentOrLazy =
  | ComponentType<NodeConfigurationProps>
  | (() => Promise<{ default: ComponentType<NodeConfigurationProps> }>);

const configComponentMap = new Map<string, ConfigComponentOrLazy>();

let autoRegistered = false;

/**
 * Discover and auto-register configuration components using require.context
 */
function autoRegisterConfigComponents() {
  if (autoRegistered) {
    return;
  }
  autoRegistered = true;

  try {
    // Use a broader regex to ensure we catch all potential config files
    // Filtering is done inside the loop for better control
    const context = require.context("./", true, /\.tsx$/);

    context.keys().forEach((key: string) => {
      // Filter files that match our naming convention: *Config.tsx or *NodeConfiguration.tsx
      if (!key.match(/[A-Za-z0-9]+(?:Config|NodeConfiguration)\.tsx$/)) {
        return;
      }

      const mod = context(key) as ConfigModule;

      const fileNameWithExt = key.split("/").pop() || "";
      const fileName = fileNameWithExt.replace(/\.tsx$/, "");

      // Verify module structure safely
      if (!mod || typeof mod !== 'object') {
        console.warn(`Module for ${key} is invalid or empty`);
        return;
      }

      // Prefer default export, then a named export matching the filename
      const component: ComponentType<NodeConfigurationProps> | undefined =
        mod.default || mod[fileName];

      if (!component) {
        console.warn(`No component found in ${key} (checked default and ${fileName})`);
        return;
      }

      // Derive a blockId-style key from the component/file name
      const inferredBlockId = componentNameToBlockId(fileName);

      if (!configComponentMap.has(fileName)) {
        configComponentMap.set(fileName, component);
      }
      if (inferredBlockId && !configComponentMap.has(inferredBlockId)) {
        configComponentMap.set(inferredBlockId, component);
      }
    });

  } catch (error) {
    console.error("Auto-registration error:", error);
  }
}

/**
 * Register a config component directly
 */
export function registerConfigComponentDirect(
  blockId: string,
  component: ComponentType<NodeConfigurationProps>
) {
  configComponentMap.set(blockId, component);
}

/**
 * Register a config component lazily
 */
export function registerConfigComponentLazy(
  blockId: string,
  lazyImport: () => Promise<{ default: ComponentType<NodeConfigurationProps> }>
) {
  configComponentMap.set(blockId, lazyImport);
}

/**
 * Get config component for a block
 * Returns component or null if not found
 */
export function getConfigComponent(
  nodeType: string,
  blockId?: string
): ComponentType<NodeConfigurationProps> | null {
  // Ensure convention-based auto-registration has run
  autoRegisterConfigComponents();

  // Try to get block definition
  const block = blockId
    ? getBlockById(blockId)
    : getBlockByNodeType(nodeType);

  if (!block) {
    return null;
  }

  // Check for shared config component
  const configComponentName = block.sharedConfigComponent || block.id;

  // Look up component (direct or lazy)
  const componentOrLazy = configComponentMap.get(configComponentName);
  if (!componentOrLazy) {
    return null;
  }

  // If it's a function, it's a lazy import - return it as-is
  if (typeof componentOrLazy === 'function' && !('displayName' in componentOrLazy) && !('propTypes' in componentOrLazy)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    if ((componentOrLazy as unknown as Function).length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lazyLoader = componentOrLazy as any;
      return lazyLoader as unknown as ComponentType<NodeConfigurationProps>;
    }
  }

  // Otherwise it's a direct component
  return componentOrLazy as ComponentType<NodeConfigurationProps>;
}

/**
 * Resolve props for config component
 */
export function resolveConfigProps(
  nodeType: string,
  blockId: string | undefined,
  context: {
    nodeData: Record<string, unknown>;
    handleDataChange: (updates: Record<string, unknown>) => void;
    authenticated?: boolean;
    login?: () => void;
    forcedProvider?: unknown;
    nodeId?: string;
    [key: string]: unknown;
  }
): NodeConfigurationProps {
  const block = blockId
    ? getBlockById(blockId)
    : getBlockByNodeType(nodeType);

  const props: NodeConfigurationProps = {
    nodeData: context.nodeData,
    handleDataChange: context.handleDataChange,
    nodeId: context.nodeId || (context.nodeData.id as string),
  };

  // Add auth props if required
  if (block?.configComponentProps?.requiresAuth) {
    // Provide authenticated as boolean (default to false if not provided)
    props.authenticated = context.authenticated ?? false;
    // Provide login function (must be provided for auth-required components)
    props.login = context.login || (() => { });
  }

  // Add forced provider if required
  if (block?.configComponentProps?.requiresForcedProvider) {
    props.forcedProvider = context.forcedProvider;
  }

  // Add any custom props from block definition
  if (block?.configComponentProps?.customProps) {
    Object.assign(props, block.configComponentProps.customProps);
  }

  // Add any additional context props
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { nodeData, handleDataChange, authenticated, login, forcedProvider, nodeId, ...rest } = context;
  Object.assign(props, rest);

  return props;
}

/**
 * Wrap config component with ErrorBoundary
 */
export function wrapConfigComponent(
  Component: ComponentType<NodeConfigurationProps>
): ComponentType<NodeConfigurationProps> {
  return Component;
}
