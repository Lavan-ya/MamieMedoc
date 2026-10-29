import {
  Body,
  Controller,
  Get,
  type MessageEvent,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { interval, map, merge, Observable } from 'rxjs';
import { CareEventsService } from '../events/care-events.service';
import { CareCircleService } from './care-circle.service';
import {
  AdherenceQuery,
  CompleteRefillDto,
  GardenQuery,
  PlanRefillDto,
} from './dto/care-circle.dto';

// Comment lines keep idle connections open through proxies; clients ignore them.
const HEARTBEAT_MS = 25_000;

@Controller('patients/:patientId')
export class CareCircleController {
  constructor(
    private readonly careCircle: CareCircleService,
    private readonly events: CareEventsService,
  ) {}

  // Family dashboard: today's doses, stock and adherence in one call
  @Get('family-dashboard')
  familyDashboard(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: AdherenceQuery,
  ) {
    return this.careCircle.familyDashboard(patientId, query.days ?? 7);
  }

  // Mamie page: today's doses, family members, planned refill
  @Get('care-circle/today')
  today(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.careCircle.today(patientId);
  }

  // Prescription & stock dashboard: remaining doses per medication
  @Get('stock')
  stock(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.careCircle.stock(patientId);
  }

  // Family dashboard: taken vs scheduled doses per day
  @Get('adherence')
  adherence(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: AdherenceQuery,
  ) {
    return this.careCircle.adherence(patientId, query.days ?? 7);
  }

  // Jeanne's page: this week's plant and the garden of past weeks
  @Get('garden')
  garden(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Query() query: GardenQuery,
  ) {
    return this.careCircle.garden(patientId, query.weeks ?? 12);
  }

  @Post('refills')
  planRefill(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: PlanRefillDto,
  ) {
    return this.careCircle.planRefill(
      patientId,
      dto.medicationId,
      dto.familyMemberId,
      dto.plannedFor,
    );
  }

  @Post('refills/:refillId/picked-up')
  completeRefill(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Param('refillId', ParseIntPipe) refillId: number,
    @Body() dto: CompleteRefillDto,
  ) {
    return this.careCircle.completeRefill(patientId, refillId, dto.doses);
  }

  // Server-sent events: `{ type }` whenever this patient's data changes.
  // Screens re-fetch on each event instead of polling.
  @Sse('events')
  stream(
    @Param('patientId', ParseIntPipe) patientId: number,
  ): Observable<MessageEvent> {
    return merge(
      this.events
        .forPatient(patientId)
        .pipe(map((type) => ({ data: { type } }))),
      interval(HEARTBEAT_MS).pipe(map(() => ({ comment: 'heartbeat' }))),
    );
  }
}
