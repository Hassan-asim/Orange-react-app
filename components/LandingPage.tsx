import React, { useState } from "react"
import { useNavigate } from 'react-router-dom'
import InstallPWAButton from './InstallPWAButton'

// Sample chat messages with translations
const chatMessages = [
    {
        id: 1,
        author: "Anna",
        lang: "de",
        original: "Guten Morgen, wie geht's?",
        translations: {
            en: "Good morning, how are you?",
            de: "Guten Morgen, wie geht's?",
            zh: "早上好，你好吗？",
        },
    },
    {
        id: 2,
        author: "Sam",
        lang: "en",
        original: "Morning! I am fine, thanks.",
        translations: {
            en: "Morning! I am fine, thanks.",
            de: "Morgen! Mir geht es gut, danke.",
            zh: "早上好！我很好，谢谢。",
        },
    },
    {
        id: 3,
        author: "Li",
        lang: "zh",
        original: "大家好，很高兴加入。",
        translations: {
            en: "Hello everyone, happy to join.",
            de: "Hallo zusammen, schön dabei zu sein.",
            zh: "大家好，很高兴加入。",
        },
    },
    {
        id: 4,
        author: "Anna",
        lang: "de",
        original: "Perfekt! Lass uns anfangen.",
        translations: {
            en: "Perfect! Let's get started.",
            de: "Perfekt! Lass uns anfangen.",
            zh: "完美！让我们开始吧。",
        },
    },
]

const userLanguages = {
    Anna: "de",
    Sam: "en",
    Li: "zh",
}

export default function OrangeChatLanding() {
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [email, setEmail] = useState("")
    const [emailError, setEmailError] = useState("")
    const [emailSuccess, setEmailSuccess] = useState(false)
    const [viewerLanguage, setViewerLanguage] = useState("en")
    const [showOriginal, setShowOriginal] = useState({})

    // Email validation
    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return re.test(email)
    }

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setEmailError("")

        if (!email) {
            setEmailError("Email is required")
            return
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address")
            return
        }

        // Simulate success
        setEmailSuccess(true)
        setEmail("")

        // Navigate to chat app after a short delay
        setTimeout(() => {
            setEmailSuccess(false)
            navigate('/chat')
        }, 2000)
    }

    const toggleOriginal = (messageId: number) => {
        setShowOriginal((prev) => ({
            ...prev,
            [messageId]: !prev[messageId],
        }))
    }

    const scrollToDemo = () => {
        document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })
    }

    const handleGetStarted = () => {
        navigate('/chat')
    }

    return (
        <>
            {/* <Head>
        <title>Orange Chat — Real-time translation for 200+ languages</title>
        <meta
          name="description"
          content="Orange Chat translates group conversations in real time into the language each participant speaks. Support for 200+ languages, per-user preferences, and instant delivery."
        />
        <meta property="og:title" content="Orange Chat — Real-time translation for 200+ languages" />
        <meta
          property="og:description"
          content="Orange Chat translates group conversations in real time into the language each participant speaks. Support for 200+ languages, per-user preferences, and instant delivery."
        />
        <meta property="og:image" content="/placeholder.svg?height=630&width=1200&text=Orange+Chat" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head> */}

            <div className="min-h-screen bg-white">
                {/* Navigation */}
                <nav className="bg-white shadow-sm border-b border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 flex items-center">
                                    {/* Orange Chat Logo */}
                                    <img src="/logg.png" className="h-8 w-8" alt="" />
                                    <span className="ml-2 text-xl font-bold text-gray-900">Orange Chat</span>
                                </div>
                            </div>

                            {/* Desktop Navigation */}
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <a
                                        href="#features"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Features
                                    </a>
                                    <a
                                        href="#demo"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Demo
                                    </a>
                                    <a
                                        href="#pricing"
                                        className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Pricing
                                    </a>
                                    <button 
                                        onClick={handleGetStarted}
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                    >
                                        Get Started
                                    </button>
                                </div>
                            </div>

                            {/* Mobile menu button */}
                            <div className="md:hidden">
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 p-2"
                                    aria-expanded={mobileMenuOpen}
                                    aria-label="Toggle mobile menu"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {mobileMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden bg-white border-t border-gray-100">
                            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                                <a
                                    href="#features"
                                    className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                                >
                                    Features
                                </a>
                                <a
                                    href="#demo"
                                    className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                                >
                                    Demo
                                </a>
                                <a
                                    href="#pricing"
                                    className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                                >
                                    Pricing
                                </a>
                                <button
                                   onClick={handleGetStarted}
                                    className="w-full text-left bg-orange-500 hover:bg-orange-600 text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    )}
                </nav>

                {/* Hero Section */}
                <section className="bg-gradient-to-br from-orange-50 to-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            {/* Badges */}
                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    200+ languages
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Real-time
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Per-user language
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Orange Chat — Real-time translation for <span className="text-orange-500">200+ languages</span>
                            </h1>

                            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                                Talk naturally. We translate instantly so every message reads in your language.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={handleGetStarted}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                                >
                                    Get Started
                                </button>
                                <button
                                    onClick={scrollToDemo}
                                    className="border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                    Try Demo
                                </button>
                                <InstallPWAButton className="border-2 border-orange-500 hover:bg-orange-500 hover:text-white text-orange-500 px-8 py-4 rounded-lg text-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Orange Chat?</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Break down language barriers with intelligent, real-time translation that adapts to each user's
                                preferences.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">200+ Languages</h3>
                                <p className="text-gray-600">
                                    Support for over 200 languages and dialects with high-accuracy translation powered by advanced AI.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Per-user Translation</h3>
                                <p className="text-gray-600">
                                    Each participant sees messages in their preferred language automatically, creating seamless
                                    conversations.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Zero Friction</h3>
                                <p className="text-gray-600">
                                    No setup required. Messages are translated instantly with enterprise-grade privacy and low latency.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Integrations</h3>
                                <p className="text-gray-600">
                                    Easy-to-use SDKs for React, React Native, and Web. Integrate in minutes, not hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Three simple steps to break down language barriers in your conversations.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Step 1 */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Detect</h3>
                                <p className="text-gray-600">
                                    Automatically detect the language of incoming messages using advanced AI language detection.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Translate</h3>
                                <p className="text-gray-600">
                                    Instantly translate messages into all participant languages while preserving context and tone.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Deliver</h3>
                                <p className="text-gray-600">
                                    Deliver personalized messages to each user in their preferred language in real-time.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Live Demo Section */}
                <section id="demo" className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">See It In Action</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Experience how Orange Chat translates conversations in real-time. Switch your language preference to see
                                how messages adapt.
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto">
                            {/* Language Selector */}
                            <div className="mb-6 text-center">
                                <label htmlFor="viewer-language" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Language Preference:
                                </label>
                                <select
                                    id="viewer-language"
                                    value={viewerLanguage}
                                    onChange={(e) => setViewerLanguage(e.target.value)}
                                    className="inline-block px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                >
                                    <option value="en">English</option>
                                    <option value="de">German (Deutsch)</option>
                                    <option value="zh">Chinese (中文)</option>
                                </select>
                            </div>

                            {/* Chat Demo */}
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Team Chat</h3>
                                    <p className="text-sm text-gray-600">Anna (German), Sam (English), Li (Chinese)</p>
                                </div>

                                <div className="p-4 space-y-4 h-80 overflow-y-auto">
                                    {chatMessages.map((message) => (
                                        <div key={message.id} className="flex items-start space-x-3">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${message.author === "Anna"
                                                        ? "bg-purple-500"
                                                        : message.author === "Sam"
                                                            ? "bg-blue-500"
                                                            : "bg-green-500"
                                                    }`}
                                            >
                                                {message.author[0]}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="font-medium text-gray-900">{message.author}</span>
                                                    <span className="text-xs text-gray-500">({userLanguages[message.author]})</span>
                                                    <button
                                                        onClick={() => toggleOriginal(message.id)}
                                                        className="text-xs text-orange-500 hover:text-orange-600 focus:outline-none focus:underline"
                                                        aria-label={`Toggle original message for ${message.author}`}
                                                    >
                                                        {showOriginal[message.id] ? "Show translated" : "Show original"}
                                                    </button>
                                                </div>
                                                <div className="bg-gray-100 rounded-lg px-3 py-2 inline-block max-w-xs">
                                                    <p className="text-gray-900">
                                                        {showOriginal[message.id] ? message.original : message.translations[viewerLanguage]}
                                                    </p>
                                                </div>
                                                {showOriginal[message.id] && (
                                                    <p className="text-xs text-gray-500 mt-1">Original in {message.lang}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            placeholder="Type a message..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            disabled
                                        />
                                        <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed">
                                            Send
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Demo mode - real chat functionality coming soon!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing/CTA Section */}
                <section id="pricing" className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                Start free, scale as you grow. No hidden fees, no surprises.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {/* Free Tier */}
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Free</h3>
                                <p className="text-gray-600 mb-4">Perfect for casual conversations</p>
                                <div className="text-3xl font-bold text-gray-900 mb-4">
                                    $0<span className="text-lg font-normal text-gray-600">/month</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        100 messages/month
                                    </li>
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        50+ languages
                                    </li>
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Basic support
                                    </li>
                                </ul>
                                <button 
                                    onClick={handleGetStarted}
                                    className="w-full border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                    Get Started
                                </button>
                            </div>

                            {/* Pro Tier */}
                            <div className="bg-white border-2 border-orange-500 rounded-xl p-6 relative">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                                        Most Popular
                                    </span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pro</h3>
                                <p className="text-gray-600 mb-4">For teams and growing businesses</p>
                                <div className="text-3xl font-bold text-gray-900 mb-4">
                                    $29<span className="text-lg font-normal text-gray-600">/month</span>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        10,000 messages/month
                                    </li>
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        200+ languages
                                    </li>
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Priority support
                                    </li>
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Analytics dashboard
                                    </li>
                                </ul>
                                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                                    Start Free Trial
                                </button>
                            </div>

                            {/* Enterprise Tier */}
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                                <p className="text-gray-600 mb-4">Custom solutions for large organizations</p>
                                <div className="text-3xl font-bold text-gray-900 mb-4">Custom</div>
                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Unlimited messages
                                    </li>
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        On-premise deployment
                                    </li>
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        24/7 dedicated support
                                    </li>
                                    <li className="flex items-center text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Custom integrations
                                    </li>
                                </ul>
                                <button className="w-full border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                                    Contact Sales
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Email Capture Section */}
                <section id="email-form" className="py-20 bg-orange-50">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Ready to Break Down Language Barriers?
                        </h2>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                            Join thousands of teams already using Orange Chat to communicate seamlessly across languages.
                        </p>

                        {emailSuccess ? (
                            <div
                                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg max-w-md mx-auto"
                                role="alert"
                                aria-live="polite"
                            >
                                <p className="font-medium">Thank you for your interest!</p>
                                <p className="text-sm">We'll notify you when Orange Chat is ready.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label htmlFor="email" className="sr-only">
                                            Email address
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email address"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            aria-describedby={emailError ? "email-error" : undefined}
                                        />
                                        {emailError && (
                                            <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">
                                                {emailError}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 whitespace-nowrap"
                                    >
                                        Get Started
                                    </button>
                                </div>
                                <p className="mt-4 text-sm text-gray-600">No spam, unsubscribe at any time. We respect your privacy.</p>
                            </form>
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center mb-4">
                                    <svg className="h-8 w-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                                    </svg>
                                    <span className="ml-2 text-xl font-bold">Orange Chat</span>
                                </div>
                                <p className="text-gray-400 max-w-md">
                                    Breaking down language barriers with intelligent, real-time translation for seamless global
                                    communication.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Company</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:underline"
                                            rel="noopener noreferrer"
                                        >
                                            Privacy Policy
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:underline"
                                            rel="noopener noreferrer"
                                        >
                                            Terms of Service
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:underline"
                                            rel="noopener noreferrer"
                                        >
                                            Contact
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Connect</h3>
                                <div className="flex space-x-4">
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                                        aria-label="Twitter"
                                        rel="noopener noreferrer"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                        </svg>
                                    </a>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                                        aria-label="LinkedIn"
                                        rel="noopener noreferrer"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                        </svg>
                                    </a>
                                    <a
                                        href="#"
                                        className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                                        aria-label="GitHub"
                                        rel="noopener noreferrer"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                            <p className="text-gray-400">© 2024 Orange Chat. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    )
}
