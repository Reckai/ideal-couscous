import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

export function NoMatchModal() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleReturn = () => {
    navigate('/')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="flex w-full max-w-[90%] flex-col items-center justify-center gap-6 p-6 sm:max-w-md">
        <CardTitle className="text-center text-xl font-bold">
          {t('SwipingPage.noMatch.title')}
        </CardTitle>
        <CardContent className="flex w-full justify-center p-0">
          <Button onClick={handleReturn} size="lg" className="w-full sm:w-auto">
            {t('SwipingPage.noMatch.returnButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
