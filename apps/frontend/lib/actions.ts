'use server';

import { createReservation, type CreateReservationInput } from '@/lib/api';

export async function submitReservation(input: CreateReservationInput) {
  const reservation = await createReservation(input);

  return { id: reservation.id };
}
