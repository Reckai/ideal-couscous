import { reatomComponent } from '@reatom/react'
import { Loader2, Search, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  animeListAtom,
  isLoadingInitialAtom,
  isLoadingMoreAtom,
  loadMoreAnimeAction,
  searchQueryAtom,
  selectedAnimeListAtom,
  updateSearchQueryAction,
} from './animeSelect.model'
import { AnimeCard } from './components/AnimeCard'
import { SelectedAnimeList } from './components/SelectedAnimeList'

export const AnimeSelectingPage = reatomComponent(() => {
  const animeList = animeListAtom()
  const searchQuery = searchQueryAtom()
  const isLoadingInitial = isLoadingInitialAtom()
  const isLoadingMore = isLoadingMoreAtom()
  const selectedList = selectedAnimeListAtom()

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isLoadingInitial) {
          loadMoreAnimeAction(searchQuery)
        }
      },
      { threshold: 0.5 },
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [isLoadingMore, isLoadingInitial, searchQuery])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-none border-b border-border/50 bg-card/50 backdrop-blur p-4 z-20">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent hidden sm:block">
            Anime Selector
          </h1>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateSearchQueryAction(e.target.value)}
              placeholder="Search anime..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-secondary/50 border-transparent focus:bg-background focus:border-primary/20 transition-all outline-none text-sm"
            />
          </div>

          {/* Mobile Drawer Toggle */}
          <button
            className="sm:hidden relative p-2 rounded-full hover:bg-muted transition-colors"
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            <Trophy className="w-5 h-5 text-primary" />
            {selectedList.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card" />
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Main Content - Grid */}
        <main className="flex-1 overflow-y-auto w-full relative custom-scrollbar" id="scroll-container">
          {isLoadingInitial && animeList.length === 0
            ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )
            : (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {animeList?.map((anime) => (
                    <AnimeCard key={anime.id} media={anime} />
                  ))}

                  {/* Infinite Scroll Trigger & Loader */}
                  <div ref={observerTarget} className="col-span-full h-20 flex items-center justify-center">
                    {isLoadingMore && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
                  </div>

                  {/* Empty State */}
                  {!isLoadingInitial && !isLoadingMore && animeList.length === 0 && (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                      No anime found. Try a different search.
                    </div>
                  )}
                </div>
              )}
        </main>

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-80 lg:w-96 flex-none h-full z-10 border-l border-border/50 bg-card/30 backdrop-blur-sm">
          <SelectedAnimeList />
        </aside>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen
        && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <div className="relative w-[300px] h-full bg-card shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <SelectedAnimeList onClose={() => setIsMobileDrawerOpen(false)} />
            </div>
          </div>
        )}
    </div>
  )
}, 'AnimeSelectingPage')
