'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { createNoticeAction, updateNoticeAction } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function NoticeForm({
  noticeId,
  initialValues,
}: {
  noticeId?: number;
  initialValues?: { title: string; content: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (noticeId) {
        await updateNoticeAction(noticeId, { title, content });
      } else {
        await createNoticeAction({ title, content });
      }
      router.push('/admin/notices');
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">제목</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          required
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
