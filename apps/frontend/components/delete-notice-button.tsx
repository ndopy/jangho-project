'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { deleteNoticeAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';

export function DeleteNoticeButton({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleClick() {
    if (!confirm('삭제하시겠습니까?')) {
      return;
    }

    setDeleting(true);
    await deleteNoticeAction(id);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={deleting}
    >
      삭제
    </Button>
  );
}
