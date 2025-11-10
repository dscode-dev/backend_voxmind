import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { PipelineService } from './pipeline.service';

@Controller('api/v1/pipeline')
export class PipelineController {
  constructor(private readonly pipe: PipelineService) {}

  @Post('approve-ideation/:id')
  approveIdeation(@Param('id') id: string) {
    return this.pipe.onIdeationApproved(+id);
  }

  @Post('approve-post/:id')
  approvePost(@Param('id') id: string) {
    return this.pipe.onPostApproved(+id);
  }

  @Post('retry-render/:id')
  retryRenderPost(@Param('id') id: string) {
    return this.pipe.onVoiceDone(+id);
  }

  @Patch('execute')
  async execute() {
    return await this.pipe.execute();
  }

  @Post('retry/:id')
  retry(
    @Param('id') id: string,
    @Body() body: { stage: 'voice' | 'render' | 'publish' },
  ) {
    return this.pipe.retryFrom(+id, body.stage);
  }
}
