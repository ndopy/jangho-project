import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class PriceOptionDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsInt()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
