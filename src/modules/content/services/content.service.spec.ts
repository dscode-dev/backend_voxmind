import { Test, TestingModule } from '@nestjs/testing';
import { ContentsService } from './content.service';


describe('ContentService', () => {
  let service: ContentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentsService],
    }).compile();

    service = module.get<ContentsService>(ContentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
