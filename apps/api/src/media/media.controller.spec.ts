import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'
import { MediaController } from './media.controller'

describe('mediaController', () => {
  let controller: MediaController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
    }).compile()

    controller = module.get<MediaController>(MediaController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
