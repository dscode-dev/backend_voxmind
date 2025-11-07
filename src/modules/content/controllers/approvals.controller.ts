import { Body, Controller, Param, Post } from '@nestjs/common';
import { ContentsService } from '../services/content.service';


@Controller('approvals')
export class ApprovalsController {
  constructor(private contents: ContentsService) {}

  @Post(':id/approve')
  async approve(@Param('id') id: string) {
    return await this.contents.approve(Number(id));
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body() body: { message?: string }) {
    return await this.contents.reject(Number(id), body?.message);
  }
}
