import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  PushSubscriptionDto,
  RemovePushSubscriptionDto,
} from './dto/push-subscription.dto';
import { PushService } from './push.service';

@Controller()
export class PushController {
  constructor(private readonly push: PushService) {}

  // The browser needs it to subscribe (applicationServerKey)
  @Get('push/public-key')
  publicKey() {
    return { publicKey: this.push.getPublicKey() };
  }

  // Jeanne's tablet turns on reminders
  @Post('patients/:patientId/push-subscriptions')
  subscribe(
    @Param('patientId', ParseIntPipe) patientId: number,
    @Body() dto: PushSubscriptionDto,
  ) {
    return this.push
      .subscribe(patientId, dto)
      .then((subscription) => ({ id: subscription.id }));
  }

  // "Send a test reminder" while setting up the tablet
  @Post('patients/:patientId/push-test')
  async test(@Param('patientId', ParseIntPipe) patientId: number) {
    const sent = await this.push.sendToPatient(patientId, {
      doseId: 0,
      title: 'Test reminder',
      body: 'Reminders are working on this tablet.',
      snoozesLeft: 0,
    });
    return { sent };
  }

  @Delete('push-subscriptions')
  @HttpCode(204)
  unsubscribe(@Body() dto: RemovePushSubscriptionDto) {
    return this.push.unsubscribe(dto.endpoint);
  }
}
