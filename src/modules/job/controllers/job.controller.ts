import { Body, Controller, Param, Post } from '@nestjs/common';
import { JobsService } from '../services/job.service';
import { PublishDto, VoiceRenderDto } from '../dto/job-actions.dto';

@Controller('jobs')
export class JobsController {
  constructor(private service: JobsService) {}

  @Post('generate/daily')
  generateDaily() {
    return this.service.generateDaily();
  }

  @Post('voice/:contentId')
  voice(@Param('contentId') id: string, @Body() body: VoiceRenderDto) {
    return this.service.voice(Number(id), body.voiceId);
  }

  @Post('render/:contentId')
  render(@Param('contentId') id: string) {
    return this.service.render(Number(id));
  }

  @Post('publish')
  publish(@Body() body: PublishDto) {
    return this.service.publish(body.platform ?? 'youtube');
  }
}
