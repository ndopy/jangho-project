import { IsDateString, IsOptional } from 'class-validator';

export class FindTidesQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
