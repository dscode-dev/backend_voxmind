import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignsRepository } from '../campaign.repository';

@Injectable()
export class CampaignsService {
  constructor(private repo: CampaignsRepository) {}

  async list(offset: number, limit: number) {
    const [items, total] = await Promise.all([this.repo.list(offset, limit), this.repo.count()]);
    return { items, total, offset, limit };
  }

  async get(id: number) {
    const c = await this.repo.get(id);
    if (!c) throw new NotFoundException('campaign_not_found');
    return c;
  }

  async create(data: any) { return await this.repo.create(data); }

  async update(id: number, data: any) {
    await this.get(id);
    return await this.repo.update(id, data);
  }

  /** Soft-delete: marca como inativa e retorna a campanha */
  async softDelete(id: number) {
    await this.get(id);
    return await this.repo.update(id, { is_active: false });
  }
}
