import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class AdherenceQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  days?: number;
}

export class GardenQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(26)
  weeks?: number;
}

export class PlanRefillDto {
  @IsInt()
  medicationId: number;

  @IsInt()
  familyMemberId: number;

  // Free text shown to Jeanne, e.g. "Thursday morning"
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  plannedFor: string;
}

export class CompleteRefillDto {
  // Doses in the new box, added to the home stock (e.g. 30 tablets)
  @IsInt()
  @Min(1)
  @Max(1000)
  doses: number;
}
