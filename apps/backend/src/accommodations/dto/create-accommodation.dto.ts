import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PriceOptionDto } from '../../common/dto/price-option.dto';

export class CreateAccommodationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(['pension', 'minbak'])
  type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceOptionDto)
  priceOptions?: PriceOptionDto[];

  @IsOptional()
  @IsString()
  checkInTime?: string;

  @IsOptional()
  @IsString()
  checkOutTime?: string;

  @IsOptional()
  @IsString()
  amenities?: string;

  @IsOptional()
  @IsString()
  houseRules?: string;

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
