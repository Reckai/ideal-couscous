import type { Media } from '../AnimeSelect/types/media'
import { reatomComponent } from '@reatom/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AnimeSwipeCard } from './components/AnimeSwipeCard'
import { SwipeActionButtons } from './components/SwipeActionButtons'

// Mock data for UI development - will be replaced with real data from WebSocket
const MOCK_ANIME: Media[] = [
  {
    id: '1',
    title: 'Attack on Titan',
    posterPath: '/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg',
    tmdbId: '1429',
    TMDBLink: 'https://www.themoviedb.org/tv/1429',
    createdAt: new Date(),
  },
  {
    id: '2',
    title: 'Death Note',
    posterPath: '/iigTJJskR1PcjjXqxdyJwVB3BoU.jpg',
    tmdbId: '13916',
    TMDBLink: 'https://www.themoviedb.org/tv/13916',
    createdAt: new Date(),
  },
  {
    id: '3',
    title: 'Fullmetal Alchemist: Brotherhood',
    posterPath: '/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg',
    tmdbId: '31911',
    TMDBLink: 'https://www.themoviedb.org/tv/31911',
    createdAt: new Date(),
  },
  {
    id: '4',
    title: 'Demon Slayer',
    posterPath: '/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg',
    tmdbId: '85937',
    TMDBLink: 'https://www.themoviedb.org/tv/85937',
    createdAt: new Date(),
  },
  {
    id: '5',
    title: 'Jujutsu Kaisen',
    posterPath: '/hFWP5HkbVEe40hrXgtCeQxoccHE.jpg',
    tmdbId: '95479',
    TMDBLink: 'https://www.themoviedb.org/tv/95479',
    createdAt: new Date(),
  },
]

export const SwipingPage = reatomComponent(() => {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatch, setShowMatch] = useState(false)
  const [matchedAnime, setMatchedAnime] = useState<Media | null>(null)

  // Mock media queue - will be replaced with real data from roomDataAtom
  const mediaQueue = MOCK_ANIME

  const currentCards = mediaQueue.slice(currentIndex, currentIndex + 2)

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const swipedMedia = mediaQueue[currentIndex]

    // Simulate match on every 3rd like (for demo purposes)
    if (direction === 'right' && currentIndex % 3 === 2) {
      setMatchedAnime(swipedMedia)
      setShowMatch(true)
    }

    setCurrentIndex((prev) => prev + 1)
  }, [currentIndex, mediaQueue])

  const handleSkip = useCallback(() => {
    handleSwipe('left')
  }, [handleSwipe])

  const handleLike = useCallback(() => {
    handleSwipe('right')
  }, [handleSwipe])

  const handleCloseMatch = useCallback(() => {
    setShowMatch(false)
    setMatchedAnime(null)
  }, [])

  const isFinished = currentIndex >= mediaQueue.length

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex-none border-b border-border/50 bg-card/50 backdrop-blur p-4 z-20">
        <div className="max-w-md mx-auto w-full flex items-center justify-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            {t('SwipingPage.title')}
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {isFinished
          ? (
              /* Empty State */
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('SwipingPage.emptyState.title')}</h2>
                <p className="text-muted-foreground mb-6">
                  {t('SwipingPage.emptyState.description')}
                  <br />
                  {t('SwipingPage.emptyState.waitForPartner')}
                </p>
              </div>
            )
          : (
              <>
                {/* Card Stack */}
                <div className="relative w-full max-w-sm aspect-[3/4] mb-8">
                  <AnimatePresence mode="popLayout">
                    {currentCards.map((media, index) => (
                      <AnimeSwipeCard
                        key={media.id}
                        media={media}
                        onSwipe={handleSwipe}
                        isTop={index === 0}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <SwipeActionButtons
                  onSkip={handleSkip}
                  onLike={handleLike}
                  disabled={isFinished}
                />

                {/* Progress Indicator */}
                <div className="mt-6 text-sm text-muted-foreground">
                  {t('SwipingPage.progress', { current: currentIndex + 1, total: mediaQueue.length })}
                </div>
              </>
            )}
      </main>

      {/* Match Modal */}
      <AnimatePresence>
        {showMatch && matchedAnime && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleCloseMatch}
            />

            {/* Match Content */}
            <motion.div
              className="relative z-10 w-full max-w-sm text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {/* Sparkles Animation */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-64 h-64 text-primary/20" />
              </motion.div>

              {/* Match Text */}
              <motion.h2
                className="text-5xl font-bold bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent mb-6"
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {t('SwipingPage.match.title')}
              </motion.h2>

              {/* Matched Anime Card */}
              <motion.div
                className="relative w-48 h-72 mx-auto rounded-xl overflow-hidden shadow-2xl mb-6"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <img
                  src={`https://image.tmdb.org/t/p/w500${matchedAnime.posterPath}`}
                  alt={matchedAnime.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg">{matchedAnime.title}</h3>
                </div>
              </motion.div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}, 'SwipingPage')
