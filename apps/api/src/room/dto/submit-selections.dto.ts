import { ArrayMinSize, IsArray, IsString } from 'class-validator'

/**
 * DTO для отправки выборов фильмов
 * Каждый участник выбирает от 5 до 20 фильмов
 */
export class SubmitSelectionsDto {
  @IsArray()
  @ArrayMinSize(5, { message: 'Please select at least 5 movies/series' })
  @IsString({ each: true })
  mediaIds: string[]
}
