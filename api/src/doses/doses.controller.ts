import { Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DosesService } from './doses.service';

// Called from Jeanne's screen only: family members cannot change doses.
@Controller('doses')
export class DosesController {
  constructor(private readonly doses: DosesService) {}

  // "I have taken my medicine"
  @Post(':id/taken')
  markTaken(@Param('id', ParseIntPipe) id: number) {
    return this.doses.markTaken(id);
  }

  // "Remind me in 15 minutes"
  @Post(':id/snooze')
  snooze(@Param('id', ParseIntPipe) id: number) {
    return this.doses.snooze(id);
  }
}
