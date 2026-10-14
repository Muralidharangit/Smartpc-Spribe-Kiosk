import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { GameDefinition } from '../games/catalog'

interface PromoBannerItem {
  id: string
  image: string
  title: string
  alt: string
  targetGameId?: string
}

const PROMO_BANNERS: PromoBannerItem[] = [
  {
    id: 'banner-1',
    image: '/assets/banner/bn11.png',
    title: 'Fly High & Win Big! Amazing rewards with every flight.',
    alt: 'Aviator Fly High Win Big Promo',
    targetGameId: 'aviator',
  },
  {
    id: 'banner-2',
    image: '/assets/banner/bn6.png',
    title: "It's Keno Time! Fast Picks: Big Wins. Your Numbers. Your Win.",
    alt: 'Keno Fast Picks Big Wins Promo',
    targetGameId: 'keno',
  },
  {
    id: 'banner-3',
    image: '/assets/banner/bn2.png',
    title: 'Spin & Win Big! Amazing rewards every spin.',
    alt: 'Wheel Spin & Win Big Promo',
    targetGameId: 'miniroulette',
  },
  {
    id: 'banner-4',
    image: '/assets/banner/bn3.png',
    title: 'Feel the thrill - Play Like a Pro! Extraordinary Wins.',
    alt: 'Feel the Thrill Promo',
    targetGameId: 'aviator',
  },
  {
    id: 'banner-5',
    image: '/assets/banner/bn7.png',
    title: 'Feel the thrill - Play Like a Pro! Extraordinary Wins.',
    alt: 'Aviator Play Like a Pro Promo',
    targetGameId: 'aviator',
  },
]

// Extended with the first two banners appended for seamless infinite forward looping
const DISPLAY_BANNERS = [...PROMO_BANNERS, PROMO_BANNERS[0], PROMO_BANNERS[1]]

interface TopPromoBannerSliderProps {
  disabled?: boolean
  catalogGames: GameDefinition[]
  onSelect: (game: GameDefinition) => void
}

export function TopPromoBannerSlider({
  disabled,
  catalogGames,
  onSelect,
}: TopPromoBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const touchEndXRef = useRef<number | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bannerCount = PROMO_BANNERS.length

  const handleNext = useCallback(() => {
    setIsTransitioning(true)
    setCurrentIndex((prev) => prev + 1)
  }, [])

  const handlePrev = useCallback(() => {
    if (currentIndex === 0) {
      // Jump instantly to cloned position, then slide back by 1
      setIsTransitioning(false)
      setCurrentIndex(bannerCount)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true)
          setCurrentIndex(bannerCount - 1)
        })
      })
    } else {
      setIsTransitioning(true)
      setCurrentIndex((prev) => prev - 1)
    }
  }, [currentIndex, bannerCount])

  // Seamless loop reset when sliding past the last banner
  useEffect(() => {
    if (currentIndex >= bannerCount) {
      // After the slide animation (650ms) finishes, silently snap back to index 0
      resetTimerRef.current = setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(0)
      }, 650)
      return () => {
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      }
    }
  }, [currentIndex, bannerCount])

  // Re-enable transition once index resets to 0
  useEffect(() => {
    if (!isTransitioning && currentIndex === 0) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true)
        })
      })
      return () => cancelAnimationFrame(raf)
    }
  }, [isTransitioning, currentIndex])

  // Continuous automatic movement (slides forward every 4.0 seconds)
  useEffect(() => {
    if (isPaused || disabled) return
    const timer = setInterval(() => {
      handleNext()
    }, 4000)
    return () => clearInterval(timer)
  }, [isPaused, disabled, handleNext])

  const handleBannerClick = (banner: PromoBannerItem) => {
    if (disabled || !banner.targetGameId) return
    const qId = banner.targetGameId.toLowerCase()
    const game = catalogGames.find(
      (g) => g.id.toLowerCase() === qId || g.name.toLowerCase().includes(qId)
    )
    if (game) {
      onSelect(game)
    }
  }

  // Touch swipe support for kiosks and touchscreens
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return
    const distance = touchStartXRef.current - touchEndXRef.current
    const minSwipeDistance = 50
    if (distance > minSwipeDistance) {
      handleNext()
    } else if (distance < -minSwipeDistance) {
      handlePrev()
    }
    touchStartXRef.current = null
    touchEndXRef.current = null
  }

  const activeDot = currentIndex % bannerCount

  return (
    <div
      className="top-promo-banner-section mb-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="top-promo-swiper-container">
        <div
          className="top-promo-swiper-track"
          style={{
            transform: `translate3d(calc(-${currentIndex} * var(--promo-slide-shift, calc(50% + 8px))), 0, 0)`,
            transition: isTransitioning
              ? 'transform 0.65s cubic-bezier(0.2, 0.9, 0.3, 1)'
              : 'none',
          }}
        >
          {DISPLAY_BANNERS.map((banner, index) => (
            <div
              key={`${banner.id}-${index}`}
              className={`top-promo-slide ${index === currentIndex || index === (currentIndex + 1) ? 'is-active' : ''}`}
              onClick={() => handleBannerClick(banner)}
              role="button"
              tabIndex={0}
              title={`Launch ${banner.title}`}
            >
              <img
                src={banner.image}
                alt={banner.alt}
                className="top-promo-banner-img"
                loading={index < 2 ? 'eager' : 'lazy'}
              />
              <div className="top-promo-banner-sheen" />
            </div>
          ))}
        </div>

        {/* Previous Button */}
        <button
          type="button"
          className="btn-promo-nav btn-promo-prev"
          onClick={(e) => {
            e.stopPropagation()
            handlePrev()
          }}
          aria-label="Previous Banner"
          title="Previous Banner"
        >
          <i className="fa-solid fa-chevron-left" />
        </button>

        {/* Next Button */}
        <button
          type="button"
          className="btn-promo-nav btn-promo-next"
          onClick={(e) => {
            e.stopPropagation()
            handleNext()
          }}
          aria-label="Next Banner"
          title="Next Banner"
        >
          <i className="fa-solid fa-chevron-right" />
        </button>

        {/* Dot Indicators */}
        <div className="top-promo-dots">
          {PROMO_BANNERS.map((banner, idx) => (
            <button
              key={`dot-${banner.id}`}
              type="button"
              className={`top-promo-dot ${idx === activeDot ? 'is-active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setIsTransitioning(true)
                setCurrentIndex(idx)
              }}
              aria-label={`Go to banner ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
