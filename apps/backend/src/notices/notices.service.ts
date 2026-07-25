import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { Notice } from './entities/notice.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticesRepository: Repository<Notice>,
  ) {}

  async create(createNoticeDto: CreateNoticeDto): Promise<Notice> {
    const newNotice = this.noticesRepository.create(createNoticeDto);

    return await this.noticesRepository.save(newNotice);
  }

  async findAll(): Promise<Notice[]> {
    return this.noticesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Notice> {
    const notice = await this.noticesRepository.findOne({ where: { id } });

    if (!notice) {
      throw new NotFoundException(`공지사항(id: ${id})을 찾을 수 없습니다.`);
    }

    return notice;
  }

  async update(id: number, updateNoticeDto: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.findOne(id);
    const updated = this.noticesRepository.merge(notice, updateNoticeDto);

    return await this.noticesRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const notice = await this.findOne(id);
    await this.noticesRepository.remove(notice);
  }
}
