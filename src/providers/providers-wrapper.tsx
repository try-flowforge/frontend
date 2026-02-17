"use client";

import dynamic from "next/dynamic";

const Providers = dynamic(() => import("../providers/providers"), { ssr: false });

export default function ProvidersWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}