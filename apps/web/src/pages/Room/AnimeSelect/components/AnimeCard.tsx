import type { Media } from '../types/media'
import { reatomComponent } from '@reatom/react'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { selectedAnimeListAtom, toggleAnimeSelectionAction } from '../animeSelect.model'

interface AnimeCardProps {
  media: Media
}

export const AnimeCard = reatomComponent(({ media }: AnimeCardProps) => {
  const selectedList = selectedAnimeListAtom()
  const isSelected = selectedList.some((item) => item.id === media.id)

  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-xl bg-muted">
      <img
        src={`https://image.tmdb.org/t/p/w500${media.posterPath}`}
        alt={media.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-4">
        <h3 className="text-white font-medium text-sm line-clamp-2 mb-2">{media.title}</h3>
        <button
          onClick={() => toggleAnimeSelectionAction(media)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
            isSelected
              ? 'bg-red-500/80 hover:bg-red-500 text-white'
              : 'bg-white/90 hover:bg-white text-black',
          )}
        >
          {isSelected
            ? (
                <>
                  <Check className="w-4 h-4" />
                  Selected
                </>
              )
            : (
                <>
                  <Plus className="w-4 h-4" />
                  Add
                </>
              )}
        </button>
      </div>

      {/* Mobile-friendly overlay (always visible on touch devices via media queries or just always generic style adjustments if needed,
          but here we use the specific desktop hover structure. For mobile we might want a different approach or rely on tap to show.)
          Let's make the selection indicator visible on top-right if selected on all screens */}
      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full shadow-md z-10">
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Mobile simplistic view override:
           On mobile, hover effects don't work well.
           We might want a persistent button or tap interaction.
           For now, let's ensure the "Add" button is accessible or the card is clickable.
           Let's make the Whole Card clickable for selection on mobile?
           Or just stick to the button. A dedicated button is safer.
       */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:hidden bg-black/60 backdrop-blur-sm">
        <div className="text-xs text-white truncate mb-2">{media.title}</div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleAnimeSelectionAction(media)
          }}
          className={cn(
            'w-full flex items-center justify-center py-1 sm:py-2 rounded-md text-xs font-medium transition-colors',
            isSelected
              ? 'bg-red-600 text-white'
              : 'bg-white text-black',
          )}
        >
          {isSelected ? 'Remove' : 'Add'}
        </button>
      </div>
    </div>
  )
}, 'AnimeCard')
