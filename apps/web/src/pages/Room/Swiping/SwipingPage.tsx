import { wrap } from '@reatom/core'
import { reatomComponent } from '@reatom/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimeSwipeCard } from './components/AnimeSwipeCard'
import { NoMatchModal } from './components/NoMatchModal'
import { SwipeActionButtons } from './components/SwipeActionButtons'
import { currentMediaIndexAtom, foundedMatchAtom, mediaDetailsAtom, queueFinishedAtom, startIndexAtom, swipeAction } from './model/swipingPage.model'

export const SwipingPage = reatomComponent(() => {
  const { t } = useTranslation()

  const isFinished = queueFinishedAtom()
  const allMedia = mediaDetailsAtom()
  const currentIndex = currentMediaIndexAtom()
  const startIndex = startIndexAtom()
  const showMatch = foundedMatchAtom() !== null
  const matchedAnime = foundedMatchAtom()

  const localIndex = currentIndex - startIndex
  const currentCard = allMedia[localIndex]
  const nextCard = allMedia[localIndex + 1]
  const visibleCards = [nextCard, currentCard].filter(Boolean)

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      wrap(swipeAction('LIKE'))
    } else {
      wrap(swipeAction('SKIP'))
    }
  }, [])

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
                    {visibleCards.map((media, index) => (
                      <AnimeSwipeCard
                        key={media.id}
                        media={media}
                        onSwipe={handleSwipe}
                        isTop={index === visibleCards.length - 1}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Action Buttons */}
                <SwipeActionButtons
                  onSkip={() => handleSwipe('left')}
                  onLike={() => handleSwipe('right')}
                  disabled={isFinished}
                />

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
              // onClick={handleCloseMatch}
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
                  alt={matchedAnime.mediaTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg">{matchedAnime.mediaTitle}</h3>
                </div>
              </motion.div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {isFinished && !matchedAnime && (
        <NoMatchModal />
      )}
    </div>
  )
}, 'SwipingPage')
