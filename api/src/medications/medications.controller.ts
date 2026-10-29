import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ListMedicationsQuery,
  UpdateMedicationDto,
} from './dto/update-medication.dto';
import { MedicationsService } from './medications.service';

@Controller('medications')
export class MedicationsController {
  constructor(private readonly medications: MedicationsService) {}

  // GET /medications?patientId=2 -> current medications with intake times
  @Get()
  list(@Query() query: ListMedicationsQuery) {
    return this.medications.list(query.patientId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicationDto,
  ) {
    return this.medications.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  stop(@Param('id', ParseIntPipe) id: number) {
    return this.medications.stop(id);
  }
}
