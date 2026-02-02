"use client";

import { FormInput } from "@/components/ui/FormInput";
import { Dropdown } from "@/components/ui/Dropdown";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { IconType } from "react-icons/lib";
import { ApiAuth } from "@/hooks/useApiNode";

interface ApiNodeFormProps {
    url: string;
    method: string;
    headers: Array<{ key: string; value: string }>;
    queryParams: Array<{ key: string; value: string }>;
    body: string;
    auth: ApiAuth;
    loading: boolean;
    onUrlChange: (value: string) => void;
    onMethodChange: (value: string) => void;
    onHeadersChange: (value: Array<{ key: string; value: string }>) => void;
    onQueryParamsChange: (value: Array<{ key: string; value: string }>) => void;
    onBodyChange: (value: string) => void;
    onAuthChange: (value: ApiAuth) => void;
    onTestRequest?: () => Promise<void>;
}

function IconButton({ onClick, icon: Icon, className }: { onClick: () => void, icon: IconType, className?: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded-md hover:bg-white/10 transition-colors ${className}`}
        >
            <Icon className="w-4 h-4" />
        </button>
    )
}

function KeyValueList({
    items,
    onChange,
    label
}: {
    items: Array<{ key: string; value: string }>;
    onChange: (items: Array<{ key: string; value: string }>) => void;
    label: string;
}) {
    const handleAdd = () => {
        onChange([...items, { key: "", value: "" }]);
    };

    const handleRemove = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: "key" | "value", value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        onChange(newItems);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Typography variant="caption" className="font-medium text-muted-foreground">
                    {label}
                </Typography>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                >
                    <LuPlus className="w-3 h-3" /> Add
                </button>
            </div>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <FormInput
                                placeholder="Key"
                                value={item.key}
                                onChange={(e) => handleChange(index, "key", e.target.value)}
                                className="h-9 py-2"
                            />
                        </div>
                        <div className="flex-1">
                            <FormInput
                                placeholder="Value"
                                value={item.value}
                                onChange={(e) => handleChange(index, "value", e.target.value)}
                                className="h-9 py-2"
                            />
                        </div>
                        <IconButton
                            onClick={() => handleRemove(index)}
                            icon={LuTrash2}
                            className="text-muted-foreground hover:text-destructive mt-0.5"
                        />
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-xs text-muted-foreground/50 italic px-2">
                        No {label.toLowerCase()} added
                    </div>
                )}
            </div>
        </div>
    );
}

export function ApiNodeForm({
    url,
    method,
    headers,
    queryParams,
    body,
    auth,
    loading,
    onUrlChange,
    onMethodChange,
    onHeadersChange,
    onQueryParamsChange,
    onBodyChange,
    onAuthChange,
    onTestRequest
}: ApiNodeFormProps) {
    const methodOptions = [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
        { label: "PATCH", value: "PATCH" },
    ];

    const authTypeOptions = [
        { label: "None", value: "none" },
        { label: "Basic Auth", value: "basic" },
        { label: "Bearer Token", value: "bearer" },
        { label: "API Key", value: "apiKey" },
    ];

    return (
        <div className="space-y-6">
            {/* Request */}
            <div className="space-y-4">
                <Dropdown
                    label="Method"
                    options={methodOptions}
                    value={method}
                    onChange={(e) => onMethodChange(e.target.value)}
                />
                <FormInput
                    label="URL"
                    value={url}
                    onChange={(e) => onUrlChange(e.target.value)}
                    placeholder="https://api.example.com/v1/resource"
                    helperText="Supports template variables like {{inputData.id}}"
                />
            </div>

            {/* Auth */}
            <div className="space-y-4">
                <Dropdown
                    label="Authentication"
                    options={authTypeOptions}
                    value={auth.type}
                    onChange={(e) => onAuthChange({ ...auth, type: e.target.value as ApiAuth["type"] } as ApiAuth)}
                />

                {auth.type === 'basic' && (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <FormInput
                                label="Username" placeholder="Username"
                                value={auth.username || ''}
                                onChange={(e) => onAuthChange({ ...auth, username: e.target.value })}
                            />
                        </div>
                        <div className="flex-1">
                            <FormInput
                                label="Password" placeholder="Password"
                                type="password"
                                value={auth.password || ''}
                                onChange={(e) => onAuthChange({ ...auth, password: e.target.value })}
                            />
                        </div>
                    </div>
                )}
                {auth.type === 'bearer' && (
                    <FormInput
                        label="Token" placeholder="Token"
                        value={auth.token || ''}
                        onChange={(e) => onAuthChange({ ...auth, token: e.target.value })}
                    />
                )}
                {auth.type === 'apiKey' && (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <FormInput
                                    label="Key Name" placeholder="Key Name"
                                    value={auth.apiKeyHeader || ''}
                                    onChange={(e) => onAuthChange({ ...auth, apiKeyHeader: e.target.value })}
                                />
                            </div>
                            <div className="flex-1">
                                <FormInput
                                    label="Value" placeholder="Value"
                                    value={auth.apiKeyValue || ''}
                                    onChange={(e) => onAuthChange({ ...auth, apiKeyValue: e.target.value })}
                                />
                            </div>
                        </div>
                        <Dropdown
                            label="Add To"
                            options={[{ label: 'Header', value: 'header' }, { label: 'Query Params', value: 'query' }]}
                            value={auth.apiKeyType || 'header'}
                            onChange={(e) => onAuthChange({ ...auth, apiKeyType: e.target.value as "header" | "query" })}
                        />
                    </div>
                )}
            </div>

            {/* Params & Headers */}
            <KeyValueList label="Query Parameters" items={queryParams} onChange={onQueryParamsChange} />
            <KeyValueList label="Headers" items={headers} onChange={onHeadersChange} />

            {/* Body */}
            {method !== 'GET' && method !== 'DELETE' && (
                <div className="space-y-1.5">
                    <FormInput
                        as="textarea"
                        label="Body (JSON)"
                        value={body}
                        onChange={(e) => onBodyChange(e.target.value)}
                        placeholder='{"key": "value"}'
                        className="min-h-37.5 font-mono text-xs"
                    />
                </div>
            )}

            {onTestRequest && (
                <Button onClick={onTestRequest} disabled={loading} className="w-full">
                    {loading ? "Sending..." : "Send Request"}
                </Button>
            )}
        </div>
    );
}
