import { Module } from '@nestjs/common';
import { ClaudePrescriptionExtractor } from './extraction/claude-prescription-extractor';
import { MockPrescriptionExtractor } from './extraction/mock-prescription-extractor';
import { PRESCRIPTION_EXTRACTOR } from './extraction/prescription-extractor';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsService,
    {
      provide: PRESCRIPTION_EXTRACTOR,
      // PRESCRIPTION_EXTRACTOR=mock returns a fixed sample without calling Claude.
      useFactory: () =>
        process.env.PRESCRIPTION_EXTRACTOR === 'mock'
          ? new MockPrescriptionExtractor()
          : new ClaudePrescriptionExtractor(),
    },
  ],
})
export class PrescriptionsModule {}
