import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ContentsService } from '../services/content.service';
import { CreateContentDto } from '../dto/create-content.dto';
import { FilterContentsDto } from '../dto/filter-contents.dto';

@Controller('api/v1/contents')
export class ContentsController {
  constructor(private service: ContentsService) {}

  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query() q: FilterContentsDto) {
    return this.service.list({
      status: q.status,
      approval: q.approval,
      campaign_id: q.campaign_id,
      offset: q.offset!,
      limit: q.limit!,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(Number(id));
  }
}
