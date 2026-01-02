import { reatomComponent } from '@reatom/react'
import { Trophy, X } from 'lucide-react'
import { selectedAnimeListAtom, toggleAnimeSelectionAction } from '../animeSelect.model'

interface SelectedAnimeListProps {
  onClose?: () => void
}

export const SelectedAnimeList = reatomComponent(({ onClose }: SelectedAnimeListProps) => {
  const selectedList = selectedAnimeListAtom()

  return (
    <div className="h-full flex flex-col bg-card border-l border-border/50">
      <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Selected</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary text-xs font-mono py-1 px-2 rounded-full">
            {selectedList.length}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {selectedList.length === 0
          ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                <p className="text-sm">No anime selected yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Search and add anime to build your list.</p>
              </div>
            )
          : (
              selectedList.map((media) => (
                <div
                  key={media.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group animate-in fade-in slide-in-from-right-4 duration-300"
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w500${media.posterPath}`}
                    alt={media.title}
                    className="w-10 h-14 object-cover rounded-md shadow-sm shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{media.title}</h4>
                  </div>
                  <button
                    onClick={() => toggleAnimeSelectionAction(media)}
                    className="p-2 left-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
      </div>
    </div>
  )
}, 'SelectedAnimeList')
