"use client";

import { useApiNode } from "@/hooks/useApiNode";
import { ApiNodeForm } from "./ApiNodeForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthenticationStatus } from "@/components/workspace/AuthenticationStatus";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { SimpleCard } from "@/components/ui/SimpleCard";
import { Typography } from "@/components/ui/Typography";

interface ApiNodeConfigurationProps {
    nodeData: Record<string, unknown>;
    handleDataChange: (updates: Record<string, unknown>) => void;
}

function ApiNodeConfigurationInner({
    nodeData,
    handleDataChange,
}: ApiNodeConfigurationProps) {
    const { wallets } = useWallets();
    const { authenticated: privyAuthenticated } = usePrivy();
    const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
    const isConnected = privyAuthenticated && embeddedWallet !== undefined;

    const api = useApiNode({
        nodeData,
        onDataChange: handleDataChange,
    });

    if (!isConnected) {
        return <AuthenticationStatus />;
    }

    return (
        <SimpleCard className="space-y-4 p-5">
            <div className="space-y-1 mb-4">
                <Typography
                    variant="h5"
                    className="font-semibold text-foreground"
                >
                    API Request
                </Typography>
                <Typography
                    variant="bodySmall"
                    className="text-muted-foreground"
                >
                    Configure external API request
                </Typography>
            </div>

            <ApiNodeForm
                url={api.url}
                method={api.method}
                headers={api.headers}
                queryParams={api.queryParams}
                body={api.body}
                auth={api.auth}
                loading={api.loading.testing}
                onUrlChange={api.actions.updateUrl}
                onMethodChange={api.actions.updateMethod}
                onHeadersChange={api.actions.updateHeaders}
                onQueryParamsChange={api.actions.updateQueryParams}
                onBodyChange={api.actions.updateBody}
                onAuthChange={api.actions.updateAuth}
            />
        </SimpleCard>
    );
}

export function ApiNodeConfiguration(props: ApiNodeConfigurationProps) {
    return (
        <ErrorBoundary>
            <ApiNodeConfigurationInner {...props} />
        </ErrorBoundary>
    );
}
