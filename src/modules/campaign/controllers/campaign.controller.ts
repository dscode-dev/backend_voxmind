import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CampaignsService } from '../services/campaign.service';
import PaginationDto from 'src/modules/common/dto/pagination.dto';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';


@Controller('campaigns')
export class CampaignsController {
  constructor(private service: CampaignsService) {}

  @Get()
  list(@Query() pag: PaginationDto) {
    return this.service.list(pag.offset!, pag.limit!);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(Number(id));
  }

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(Number(id));
  }
}
