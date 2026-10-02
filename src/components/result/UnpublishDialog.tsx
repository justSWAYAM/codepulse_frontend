import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, Field, Textarea } from '../ui';
import { useUnpublishResults } from '../../hooks/useResults';
import { getErrorMessage } from '../../lib/apiError';

const schema = z.object({
  reason: z.string().trim().min(3, 'Say briefly why (at least 3 characters).').max(500, 'Keep it under 500 characters.'),
});
type FormData = z.infer<typeof schema>;

interface UnpublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contestId: string;
}

export const UnpublishDialog: React.FC<UnpublishDialogProps> = ({ open, onOpenChange, contestId }) => {
  const unpublish = useUnpublishResults(contestId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { reason: '' } });

  useEffect(() => {
    if (open) {
      reset({ reason: '' });
      unpublish.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = handleSubmit(({ reason }) =>
    unpublish.mutate(reason.trim(), {
      onSuccess: () => {
        toast.success('Results unpublished');
        onOpenChange(false);
      },
    }),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!unpublish.isPending}
      tone="warning"
      icon={<EyeOff className="size-5" />}
      size="sm"
      title="Unpublish results?"
      description="Candidates lose access to their scores until you publish again. Use this to correct a mistake. The reason is recorded in the audit log."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={unpublish.isPending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={unpublish.isPending} leadingIcon={<EyeOff className="size-4" />}>
            Unpublish results
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Reason" required error={errors.reason?.message}>
          {(a11y) => <Textarea {...a11y} {...register('reason')} placeholder="e.g. Q2 had a wrong test case" rows={3} />}
        </Field>
        {unpublish.isError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] leading-5 text-danger-text">
            {getErrorMessage(unpublish.error, 'Couldn’t unpublish results.')}
          </p>
        )}
      </form>
    </Dialog>
  );
};
