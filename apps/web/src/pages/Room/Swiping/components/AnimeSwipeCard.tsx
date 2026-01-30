import type { PanInfo } from 'framer-motion'
import type { Media } from '../../AnimeSelect/types/media'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { Heart, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AnimeSwipeCardProps {
  media: Media
  onSwipe: (direction: 'left' | 'right') => void
  isTop: boolean
}

export function AnimeSwipeCard({ media, onSwipe, isTop }: AnimeSwipeCardProps) {
  const { t } = useTranslation()
  const x = useMotionValue(0)

  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const likeOpacity = useTransform(x, [0, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100

    if (info.offset.x > threshold) {
      onSwipe('right')
    } else if (info.offset.x < -threshold) {
      onSwipe('left')
    }
  }

  return (
    <motion.div
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      style={{
        x,
        rotate,
        zIndex: isTop ? 10 : 0,
      }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{
        x: x.get() > 0 ? 300 : -300,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-card">
        {/* Anime Poster */}
        <img
          src={`https://image.tmdb.org/t/p/w500${media.posterPath}`}
          alt={media.title}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* LIKE Indicator */}
        <motion.div
          className="absolute top-8 right-8 border-4 border-green-500 rounded-lg px-4 py-2 rotate-12"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-green-500 text-3xl font-bold tracking-wider">{t('SwipingPage.like')}</span>
        </motion.div>

        {/* NOPE Indicator */}
        <motion.div
          className="absolute top-8 left-8 border-4 border-red-500 rounded-lg px-4 py-2 -rotate-12"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-red-500 text-3xl font-bold tracking-wider">{t('SwipingPage.nope')}</span>
        </motion.div>

        {/* Anime Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2 line-clamp-2">{media.title}</h2>
          {media.TMDBLink && (
            <a
              href={media.TMDBLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary/80 hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {t('SwipingPage.viewOnTmdb')}
            </a>
          )}
        </div>

        {/* Action Hints */}
        <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white/60">
          <X className="w-5 h-5" />
          <span className="text-sm">{t('SwipingPage.swipeLeftToSkip')}</span>
        </div>
        <div className="absolute bottom-6 right-6 flex items-center gap-2 text-white/60">
          <span className="text-sm">{t('SwipingPage.swipeRightToLike')}</span>
          <Heart className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  )
}
