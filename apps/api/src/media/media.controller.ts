import { Controller, Get, Param, Query } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaDto, MediaListResponseDto, MediaQueryDto } from './dto/media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async findAll(@Query() query: MediaQueryDto): Promise<MediaListResponseDto> {
    return this.mediaService.findAll(query);
  }
  @Get(':id')
  async findById(@Param('id') id: string): Promise<MediaDto> {
    return this.mediaService.findById(id);
  }
}
