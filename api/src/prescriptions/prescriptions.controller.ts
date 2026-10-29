import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfirmPrescriptionDto } from './dto/confirm-prescription.dto';
import {
  ListPrescriptionsQuery,
  ScanPrescriptionBody,
} from './dto/list-prescriptions.query';
import { PrescriptionsService } from './prescriptions.service';

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_SCAN_BYTES = 10 * 1024 * 1024;

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  // multipart/form-data: file=<photo or pdf>, patientId=<id>
  @Post('scan')
  @UseInterceptors(
    FileInterceptor('file', {
      // Kept in memory so the buffer can be sent to the extractor (Claude) as-is.
      storage: memoryStorage(),
      limits: { fileSize: MAX_SCAN_BYTES },
      fileFilter: (_req, file, accept) => {
        if (ACCEPTED_TYPES.includes(file.mimetype)) return accept(null, true);
        accept(
          new BadRequestException(
            'Upload a JPG, PNG, WEBP or PDF prescription',
          ),
          false,
        );
      },
    }),
  )
  scan(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: ScanPrescriptionBody,
  ) {
    if (!file) throw new BadRequestException('A prescription file is required');
    return this.prescriptions.scan(body.patientId, {
      buffer: file.buffer,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });
  }

  // GET /prescriptions?patientId=2&status=DRAFT  -> review list
  @Get()
  list(@Query() query: ListPrescriptionsQuery) {
    return this.prescriptions.list(query.patientId, query.status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.prescriptions.findOne(id);
  }

  @Post(':id/confirm')
  confirm(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmPrescriptionDto,
  ) {
    return this.prescriptions.confirm(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  discard(@Param('id', ParseIntPipe) id: number) {
    return this.prescriptions.discard(id);
  }
}
