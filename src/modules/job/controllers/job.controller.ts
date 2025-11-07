import { Body, Controller, Param, Post } from '@nestjs/common';
import { JobsService } from '../services/job.service';

@Controller('jobs')
export class JobsController {
  constructor(private service: JobsService) {}

  @Post('generate/daily')
  generateDaily() { return this.service.generateDaily(); }

  @Post('voice/:contentId')
  voice(@Param('contentId') id: string, @Body() body: { voiceId?: string }) {
    return this.service.voice(Number(id), body.voiceId);
  }

  @Post('render/:contentId')
  render(@Param('contentId') id: string, @Body() body: { imagePath?: string }) {
    return this.service.renderVideo(Number(id), body?.imagePath);
  }

  @Post('publish')
  publish(@Body() body: { platform?: string }) {
    return this.service.publish(body?.platform ?? 'youtube');
  }

  @Post('analytics/collect')
  analyticsCollect() {
    return this.service.analyticsCollect();
  }
}
