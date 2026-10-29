import { IsInt, IsOptional } from 'class-validator';

export class MarkTakenDto {
  // Family member who confirmed; omitted when Jeanne confirms herself.
  @IsOptional()
  @IsInt()
  familyMemberId?: number;
}
