'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteNoticeAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';

export function DeleteNoticeButton({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm('삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteNoticeAction(id);
      router.refresh();
    } catch {
      setError('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={deleting}
      >
        삭제
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
