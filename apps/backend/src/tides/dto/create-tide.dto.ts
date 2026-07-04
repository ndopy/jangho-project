import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTideDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  lowTide1Time?: string;

  @IsOptional()
  @IsInt()
  lowTide1Level?: number;

  @IsOptional()
  @IsString()
  lowTide2Time?: string;

  @IsOptional()
  @IsInt()
  lowTide2Level?: number;

  @IsOptional()
  @IsString()
  highTide1Time?: string;

  @IsOptional()
  @IsInt()
  highTide1Level?: number;

  @IsOptional()
  @IsString()
  highTide2Time?: string;

  @IsOptional()
  @IsInt()
  highTide2Level?: number;
}
