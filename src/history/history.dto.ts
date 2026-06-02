import { IsString, IsIn, IsOptional } from 'class-validator';
import { HISTORY_TYPES } from './domain/history.entity';

export class GetHistoryByPeriodDto {
  @IsString()
  @IsIn(HISTORY_TYPES, {
    message: `El período debe ser uno de: ${HISTORY_TYPES.join(', ')}`,
  })
  period: string;

  @IsOptional()
  @IsString()
  date?: string; // ISO string — si no se envía se usa la fecha actual
}