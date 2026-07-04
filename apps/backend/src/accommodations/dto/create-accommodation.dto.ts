import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAccommodationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['pension', 'minbak'])
  type: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacityMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacityMax?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
