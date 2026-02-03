import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { AbstractMediaRepository } from './interfaces'
import { MediaService } from './media.service'

describe('mediaService', () => {
  let service: MediaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: AbstractMediaRepository,
          useValue: {
            findAllWithCursor: jest.fn(),
            findById: jest.fn(),
            findManyByIds: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<MediaService>(MediaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
