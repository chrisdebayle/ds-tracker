"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function ShareLinkControls({
  label,
  previewLabel,
  url,
  revoked,
  onRevoke,
  onRegenerate,
}: {
  label: string;
  previewLabel: string;
  url: string;
  revoked: boolean;
  onRevoke: () => Promise<void>;
  onRegenerate: () => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.open(url, "_blank");
    }
  }

  if (revoked) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[var(--db-fail)] font-semibold">Link revoked</span>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => startTransition(async () => { await onRegenerate(); router.refresh(); })}
        >
          {isPending ? "Generating…" : "Generate New Link"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a href={url} target="_blank" className="text-[13px] font-semibold text-[var(--db-primary)]">
        {previewLabel}
      </a>
      <Button type="button" variant="outline" onClick={copy}>
        {copied ? "Link Copied!" : label}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          if (!confirm("Revoke this link? The current URL will stop working immediately.")) return;
          startTransition(async () => { await onRevoke(); router.refresh(); });
        }}
      >
        Revoke
      </Button>
    </div>
  );
}
