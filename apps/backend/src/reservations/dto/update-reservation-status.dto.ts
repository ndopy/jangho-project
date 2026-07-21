import { IsIn } from 'class-validator';

export class UpdateReservationStatusDto {
  @IsIn(['confirmed', 'hold'])
  status: 'confirmed' | 'hold';
}
