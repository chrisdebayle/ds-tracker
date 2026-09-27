"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function CopyLinkButton({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.open(url, "_blank");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" onClick={copy} type="button">
      {copied ? "Link Copied!" : label}
    </Button>
  );
}
