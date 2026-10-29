import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import type { Patient } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The ONLY place that decides who the current patient is.
 * For now: the first patient. Later: the patient linked to the signed-in
 * account (read the session token from `request` here). No route changes.
 */
@Injectable()
export class CurrentPatientPipe implements PipeTransform<Request, Promise<Patient>> {
  constructor(private readonly prisma: PrismaService) {}

  async transform(_request: Request): Promise<Patient> {
    const patient = await this.prisma.patient.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!patient) {
      throw new NotFoundException('No patient found. Run "npm run seed".');
    }
    return patient;
  }
}

const RequestParam = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<Request>(),
);

/** Use in any route: `getX(@CurrentPatient() patient: Patient)`. */
export const CurrentPatient = () => RequestParam(CurrentPatientPipe);
