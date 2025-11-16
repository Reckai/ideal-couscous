import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Heart, Users, Zap, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {ROUTES} from "@/lib/routes";
import { LanguageSwitcher } from '@/components/LanguageSwitcher';


export default function Home() {
    const t = useTranslations('HomePage');

    return (
        <div className="min-h-screen bg-background text-foreground dark">
            {/* Language Switcher - Fixed Position */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
                {/* Animated gradient background */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
                </div>

                <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in duration-1000">
                    {/* Logo/Icon */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 animate-in zoom-in duration-700">
                        <Heart className="w-10 h-10 text-pink-400" />
                    </div>

                    {/* Heading */}
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance leading-tight">
                        <span className="text-foreground">{t('title')}</span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">{t('subtitle')}</span>
                    </h1>

                    {/* Tagline */}
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t('tagline')}
                    </p>

                    {/* CTA Button */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Link
                            href={ROUTES.ROOM.ROOT}
                        >
                            <Button
                                size="lg"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 text-base h-12 px-8 rounded-lg transition-all duration-300 transform hover:scale-105"
                            >
                                {t('createOrJoinRoom')}
                            </Button>

                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-purple-500/30 hover:border-purple-500/60 text-base h-12 px-8 rounded-lg transition-colors duration-300"
                        >
                            {t('learnMore')}
                        </Button>
                    </div>

                    {/* Decorative elements */}
                    <div className="pt-12 flex justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-400/60 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-pink-400/60 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 rounded-full bg-purple-400/60 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 px-4 bg-card/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-balance mb-4">{t('howItWorks.title')}</h2>
                        <p className="text-muted-foreground text-lg">{t('howItWorks.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Step 1 */}
                        <Card className="p-6 border-border/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{t('howItWorks.steps.createOrJoin.title')}</h3>
                            <p className="text-muted-foreground">{t('howItWorks.steps.createOrJoin.description')}</p>
                        </Card>

                        {/* Step 2 */}
                        <Card className="p-6 border-border/50 hover:border-pink-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 group">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-transparent border border-pink-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Sparkles className="w-6 h-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{t('howItWorks.steps.pickYourPicks.title')}</h3>
                            <p className="text-muted-foreground">{t('howItWorks.steps.pickYourPicks.description')}</p>
                        </Card>

                        {/* Step 3 */}
                        <Card className="p-6 border-border/50 hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 group">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{t('howItWorks.steps.swipeTogether.title')}</h3>
                            <p className="text-muted-foreground">{t('howItWorks.steps.swipeTogether.description')}</p>
                        </Card>

                        {/* Step 4 */}
                        <Card className="p-6 border-border/50 hover:border-pink-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 group">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500/20 to-transparent border border-pink-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                                <Heart className="w-6 h-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{t('howItWorks.steps.matchAndWatch.title')}</h3>
                            <p className="text-muted-foreground">{t('howItWorks.steps.matchAndWatch.description')}</p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/30 py-12 px-4 bg-background/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        {/* Brand */}
                        <div>
                            <h3 className="text-2xl font-bold mb-2 text-balance">{t('footer.brand')}</h3>
                            <p className="text-muted-foreground text-sm">{t('footer.brandDescription')}</p>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-semibold mb-4">{t('footer.getInTouch')}</h4>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground mb-1">{t('footer.email')}</p>
                                    <a href="mailto:casa101565@gmail.com" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                                        casa101565@gmail.com
                                    </a>
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1">{t('footer.telegram')}</p>
                                    <a href="https://t.me/seol18" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                                        @seol18
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Info */}
                        <div>
                            <h4 className="font-semibold mb-4">{t('footer.about')}</h4>
                            <p className="text-sm text-muted-foreground">
                                {t('footer.aboutDescription')}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/30 pt-8">
                        <p className="text-center text-sm text-muted-foreground">
                            {t('footer.madeWith')} <Heart className="inline w-4 h-4 text-pink-400 mx-1" /> {t('footer.forCouples')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
