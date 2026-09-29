import { Button } from "./Button";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export function CopyButton({text}: {text: string}) {
  const [copySuccess, setCopySuccess] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1000);
  }

  return (
    <Button onClick={handleCopy} disabled={copySuccess} variant="ghost" className="h-full px-0 py-0">
        {!copySuccess && <ClipboardDocumentListIcon className="w-6 h-6" aria-label="Copy to clipboard" />}
        {copySuccess && <p>Copied!</p>}
    </Button>
  )
}