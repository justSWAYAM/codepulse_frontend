import { useState } from 'react';
import { toast } from 'sonner';
import { copyText } from '../../../lib/copyText';
import { Button, Dialog, Textarea } from '../../../components/ui';

interface Props {
  getText: () => string;
  label?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export function CopyPromptButton({
  getText,
  label = 'Copy AI Prompt',
  disabled,
  variant = 'primary',
}: Props) {
  const [copied, setCopied] = useState(false);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  async function onClick() {
    const text = getText();
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      toast.success('Prompt copied');
      setTimeout(() => setCopied(false), 2000);
    } else {
      setFallbackText(text); // manual copy
    }
  }

  return (
    <>
      <Button type="button" variant={variant} disabled={disabled} onClick={onClick}>
        {copied ? 'Copied ✓' : label}
      </Button>

      <Dialog
        open={fallbackText !== null}
        onOpenChange={(o) => !o && setFallbackText(null)}
        title="Copy manually"
        description="Your browser blocked automatic copying. Select all and copy."
      >
        <div className="space-y-4 pt-2">
          <Textarea
            readOnly
            value={fallbackText ?? ''}
            className="h-64 font-mono text-xs"
            onFocus={(e) => e.currentTarget.select()}
            autoFocus
          />
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setFallbackText(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
