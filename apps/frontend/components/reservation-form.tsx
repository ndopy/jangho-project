'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';

import { submitReservation } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function ReservationForm({
  itemType,
  itemId,
  itemName,
}: {
  itemType: 'experience' | 'accommodation';
  itemId: number;
  itemName: string;
}) {
  const [date, setDate] = useState<Date | undefined>();
  const [peopleCount, setPeopleCount] = useState('2');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!date) {
      setError('희망 날짜를 선택해주세요.');
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      await submitReservation({
        itemType,
        itemId,
        itemName,
        desiredDate: toDateInputValue(date),
        peopleCount: Number(peopleCount),
        applicantName,
        applicantPhone,
        message: message || undefined,
      });
      setStatus('done');
    } catch {
      setError('예약 신청에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-muted-foreground">
        예약 신청이 접수되었습니다. 입력하신 연락처로 마을에서 확인 연락을
        드립니다.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>희망 날짜</Label>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start font-normal',
                  !date && 'text-muted-foreground',
                )}
              >
                <CalendarIcon />
                {date
                  ? date.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short',
                    })
                  : '날짜를 선택하세요'}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="peopleCount">인원</Label>
        <Input
          id="peopleCount"
          type="number"
          min={1}
          required
          value={peopleCount}
          onChange={(e) => setPeopleCount(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="applicantName">신청자 이름</Label>
        <Input
          id="applicantName"
          required
          value={applicantName}
          onChange={(e) => setApplicantName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="applicantPhone">연락처</Label>
        <Input
          id="applicantPhone"
          type="tel"
          placeholder="010-0000-0000"
          required
          value={applicantPhone}
          onChange={(e) => setApplicantPhone(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">요청사항 (선택)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? '신청 중...' : '예약 신청하기'}
      </Button>
    </form>
  );
}
