import {
  IsIn,
  IsInt,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @IsIn(['experience', 'accommodation'])
  itemType: 'experience' | 'accommodation';

  @IsInt()
  itemId: number;

  @IsString()
  @IsNotEmpty()
  itemName: string;

  @IsDateString()
  desiredDate: string;

  @IsInt()
  @Min(1)
  peopleCount: number;

  @IsString()
  @IsNotEmpty()
  applicantName: string;

  @IsString()
  @IsNotEmpty()
  applicantPhone: string;

  @IsOptional()
  @IsString()
  message?: string;
}
