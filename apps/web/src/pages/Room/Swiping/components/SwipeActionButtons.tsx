import { Heart, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface SwipeActionButtonsProps {
  onSkip: () => void
  onLike: () => void
  disabled?: boolean
}

export function SwipeActionButtons({ onSkip, onLike, disabled }: SwipeActionButtonsProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center gap-6">
      {/* Skip Button */}
      <button
        onClick={onSkip}
        disabled={disabled}
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
          'bg-card border-2 border-red-500/50 text-red-500',
          'hover:bg-red-500/10 hover:border-red-500 hover:scale-110',
          'active:scale-95',
          'shadow-lg hover:shadow-red-500/25',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        )}
        aria-label={t('SwipingPage.skip')}
      >
        <X className="w-8 h-8" />
      </button>

      {/* Like Button */}
      <button
        onClick={onLike}
        disabled={disabled}
        className={cn(
          'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
          'bg-card border-2 border-green-500/50 text-green-500',
          'hover:bg-green-500/10 hover:border-green-500 hover:scale-110',
          'active:scale-95',
          'shadow-lg hover:shadow-green-500/25',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        )}
        aria-label={t('SwipingPage.likeAction')}
      >
        <Heart className="w-8 h-8" />
      </button>
    </div>
  )
}
