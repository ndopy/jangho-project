'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  createReservation,
  updateReservationStatus,
  type CreateReservationInput,
  type ReservationStatus,
} from '@/lib/api';
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/lib/session';

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
  await updateReservationStatus(id, status);
  revalidatePath(`/admin/reservations/${id}`);
  revalidatePath('/admin/reservations');
}
