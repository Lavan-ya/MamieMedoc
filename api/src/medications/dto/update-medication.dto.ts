import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { ConfirmedSlotDto } from '../../prescriptions/dto/confirm-prescription.dto';

export class ListMedicationsQuery {
  @Type(() => Number)
  @IsInt()
  patientId: number;
}

export class UpdateMedicationDto {
  // Replaces the intake times. To stop a medication, DELETE it instead.
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'choose at least one intake time' })
  @ArrayUnique((slot: ConfirmedSlotDto) => slot.timeOfDay)
  @ValidateNested({ each: true })
  @Type(() => ConfirmedSlotDto)
  schedule?: ConfirmedSlotDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  stockDoses?: number;

  @IsOptional()
  @IsBoolean()
  lowStockAlert?: boolean;
}
