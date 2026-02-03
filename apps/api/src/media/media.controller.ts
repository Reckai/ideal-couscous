import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { GetAnimeBatchDto, MediaDto, MediaListResponseDto, MediaQueryDto } from './dto/media.dto'
import { AbstractMediaService } from './interfaces'

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: AbstractMediaService) { }

  @Get()
  async findAll(@Query() query: MediaQueryDto): Promise<MediaListResponseDto> {
    return this.mediaService.findAll(query)
  }

  @Post('batch')
  async getAnimeBatch(@Body() dto: GetAnimeBatchDto): Promise<MediaDto[]> {
    return this.mediaService.findByIds(dto.ids)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<MediaDto> {
    return this.mediaService.findById(id)
  }
}
