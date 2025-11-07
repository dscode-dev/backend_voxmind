import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentsRepository } from '../contents.repository';
import { CampaignsService } from 'src/modules/campaign/services/campaign.service';

@Injectable()
export class ContentsService {
  constructor(private repo: ContentsRepository, private campaigns: CampaignsService) {}

  async create(data: any) {
    await this.campaigns.get(data.campaign_id);
    return await this.repo.create({
      ...data,
      status: 'planned',
      approval_status: 'pending',
      tags: data.tags ?? '',
      script_text: data.script_text ?? '',
      preview_caption: '',
    });
  }

  async get(id: number) {
    const c = await this.repo.get(id);
    if (!c) throw new NotFoundException('content_not_found');
    return c;
  }

  async list(filter: { status?: string; approval?: string; campaign_id?: number; offset: number; limit: number; }) {
    return await this.repo.list(filter);
  }

  async approve(id: number) {
    await this.get(id);
    return await this.repo.update(id, { approval_status: 'approved', review_source: 'frontend' });
  }

  async reject(id: number, message?: string) {
    await this.get(id);
    return await this.repo.update(id, { approval_status: 'rejected', review_source: 'frontend', review_message: message ?? null });
  }
}
