

import { Heart, Sparkles } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
            {/* Hero Section */}
            <section className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 relative">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                    <div
                        className="absolute bottom-20 right-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
                        style={{ animationDelay: "1s" }}
                    ></div>
                </div>

                <div className="relative z-10 text-center max-w-4xl">
                    {/* Subtitle badge */}
                    <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-slate-300">Find your next watch together</span>
                    </div>

                    {/* Main heading */}
                    <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight">
                        <span className="text-balance">Find what to watch</span>
                        <br />
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              together
            </span>
                    </h1>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto text-balance">
                        Create a room with your partner, pick shows you want to watch, swipe through recommendations, and get
                        notified when you both like something. Never argue about what to watch again.
                    </p>

                    {/* CTA Button */}
                    <Link
                        href="/room"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/50"
                    >
                        <span>Start Watching Together</span>
                        <Heart className="w-5 h-5" />
                    </Link>

                    {/* Trust indicators */}
                    <p className="text-sm text-slate-500 mt-8">
                        Perfect for movie nights • No account needed • Real-time matching
                    </p>
                </div>
            </section>

            {/* How it works section */}
            <section className="py-20 px-4 md:px-8 relative">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-balance">How AniTinder works</h2>
                    <p className="text-center text-slate-400 mb-16 text-balance">Three simple steps to find your perfect show</p>

                    {/* Steps grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="group">
                            <div className="p-8 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-md hover:bg-white/10">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-6 text-2xl font-bold group-hover:scale-110 transition-transform">
                                    1
                                </div>
                                <h3 className="text-xl font-bold mb-3">Create or Join</h3>
                                <p className="text-slate-400">
                                    One person creates a room, shares the code with their partner. They join with the same code. That's
                                    it!
                                </p>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="group">
                            <div className="p-8 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-all duration-300 backdrop-blur-md hover:bg-white/10">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-6 text-2xl font-bold group-hover:scale-110 transition-transform">
                                    2
                                </div>
                                <h3 className="text-xl font-bold mb-3">Pick Your Favorites</h3>
                                <p className="text-slate-400">
                                    Browse through shows and movies, like the ones you want to watch. Your partner does the same in
                                    real-time.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="group">
                            <div className="p-8 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all duration-300 backdrop-blur-md hover:bg-white/10">
                                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 text-2xl font-bold group-hover:scale-110 transition-transform">
                                    ♥
                                </div>
                                <h3 className="text-xl font-bold mb-3">Get Matched</h3>
                                <p className="text-slate-400">
                                    When you both like the same show or movie, you instantly get notified. Start watching immediately!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 md:px-8 border-t border-white/10 bg-slate-950/50 backdrop-blur-md">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Branding */}
                        <div className="text-center md:text-left">
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                AniTinder
                            </h3>
                            <p className="text-sm text-slate-500">
                                A pet project by someone who got tired of arguing with their partner about what to watch
                            </p>
                        </div>

                        {/* Contact info */}
                        <div className="flex flex-col md:flex-row items-center gap-6 text-slate-400">
                            <a
                                href="mailto:casa101565@gmail.com"
                                className="hover:text-purple-400 transition-colors flex items-center gap-2 text-sm"
                            >
                                <span>✉️</span>
                                casa101565@gmail.com
                            </a>
                            <a
                                href="https://t.me/seol18"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-pink-400 transition-colors flex items-center gap-2 text-sm"
                            >
                                <span>✈️</span>
                                @seol18
                            </a>
                        </div>
                    </div>

                    {/* Bottom text */}
                    <div className="mt-8 pt-8 border-t border-white/10 text-center text-xs text-slate-500">
                        Made with ♥ for couples everywhere. Built with passion, lots of coffee, and one too many arguments about
                        what to watch.
                    </div>
                </div>
            </footer>
        </main>
    )
}
