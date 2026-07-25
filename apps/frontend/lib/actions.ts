'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  createNotice,
  createReservation,
  deleteNotice,
  updateNotice,
  updateReservationStatus,
  type CreateNoticeInput,
  type CreateReservationInput,
  type ReservationStatus,
} from '@/lib/api';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
} from '@/lib/session';

async function requireAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isValid = token ? await verifySessionToken(token) : false;

  if (!isValid) {
    throw new Error('관리자 인증이 필요합니다.');
  }
}

export async function submitReservation(input: CreateReservationInput) {
  const reservation = await createReservation(input);

  return { id: reservation.id };
}

export async function loginAdmin(
  formData: FormData,
): Promise<{ error?: string }> {
  const password = formData.get('password');

  if (typeof password !== 'string' || password !== process.env.ADMIN_PASSWORD) {
    return { error: '비밀번호가 틀렸습니다.' };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });

  return {};
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect('/admin/login');
}

export async function updateReservationStatusAction(
  id: number,
  status: ReservationStatus,
) {
  await requireAdminSession();
  await updateReservationStatus(id, status);
  revalidatePath(`/admin/reservations/${id}`);
  revalidatePath('/admin/reservations');
}

export async function createNoticeAction(input: CreateNoticeInput) {
  await requireAdminSession();
  const notice = await createNotice(input);
  revalidatePath('/admin/notices');

  return { id: notice.id };
}

export async function updateNoticeAction(id: number, input: CreateNoticeInput) {
  await requireAdminSession();
  await updateNotice(id, input);
  revalidatePath('/admin/notices');
}

export async function deleteNoticeAction(id: number) {
  await requireAdminSession();
  await deleteNotice(id);
  revalidatePath('/admin/notices');
}
