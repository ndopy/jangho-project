import { PartialType } from '@nestjs/mapped-types';
import { CreateTideDto } from './create-tide.dto';

export class UpdateTideDto extends PartialType(CreateTideDto) {}
