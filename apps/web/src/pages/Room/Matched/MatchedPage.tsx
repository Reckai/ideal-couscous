import { reatomComponent } from '@reatom/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { isLoadingAtom, matchedMediaDataAtom } from './model/matched.model'

export const MatchedPage = reatomComponent(() => {
  const { t } = useTranslation()

  const matchedAnime = matchedMediaDataAtom()

  const isLoading = isLoadingAtom()

  return isLoading
    ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="44"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray="276"
                className="text-primary animate-countdown"
              />
            </svg>
          </div>

        </div>
      )
    : matchedAnime
      && (
        <AnimatePresence>

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

        </AnimatePresence>
      )
}, 'MatchedPAge')
