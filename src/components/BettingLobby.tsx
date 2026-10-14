import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  GAME_FALLBACK_IMAGE,
  HOME_GAMES,
  SPRIBE_CATALOG_GAMES,
  getSpribeImage,
  type GameDefinition,
  type LobbyProvider,
} from '../games/catalog'
import { useShopProviders } from '../hooks/useShopProviders'
import { loadTerminal } from '../lib/storage'
import { useMachine } from '../services/sessionStore'
import { TopPromoBannerSlider } from './TopPromoBannerSlider'

type LobbyTab =
  | 'all'
  | 'spribe'
  | 'providers'
  | 'slots'
  | 'crash'
  | 'live'
  | string

type Props = {
  disabled: boolean
  onSelect: (game: GameDefinition) => void
  waitingForCoins?: boolean
  cashOutPending?: boolean
  offline?: boolean
  playSlot?: ReactNode
  onLeaveGame?: () => void
  onCashOut?: () => void
}

function getCardTheme(game: GameDefinition): 'red' | 'purple' | 'green' | 'cyan' | 'blue' | 'gold' | 'dark' {
  const id = (game.id || '').toLowerCase()
  const name = (game.name || '').toLowerCase()
  
  if (id.includes('keno') || name.includes('keno') || id.includes('balloon') || name.includes('balloon')) return 'red'
  if (id.includes('dice') || name.includes('dice') || id.includes('hotline') || name.includes('hotline')) return 'purple'
  if (id.includes('goal') || name.includes('goal') || id.includes('soccer') || id.includes('roulette') || name.includes('roulette')) return 'green'
  if (id.includes('plinko') || name.includes('plinko')) return 'cyan'
  if (id.includes('mine') || name.includes('mine')) return 'blue'
  if (id.includes('hi_lo') || name.includes('hi-lo') || id.includes('coin') || id.includes('jackpot')) return 'gold'
  if (id.includes('aviator') || id.includes('sports') || id.includes('chicken') || id.includes('trader')) return 'dark'
  
  const hash = (id + name).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const themes: ('red' | 'purple' | 'green' | 'cyan' | 'blue' | 'gold')[] = ['red', 'purple', 'green', 'cyan', 'blue', 'gold']
  return themes[hash % themes.length]
}

function getProviderIcon(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('spribe') || lower.includes('aviator')) return 'fa-solid fa-plane'
  if (lower.includes('endorphina')) return 'fa-solid fa-gem'
  if (lower.includes('ka') || lower.includes('king') || lower.includes('royal')) return 'fa-solid fa-crown'
  if (lower.includes('evoplay') || lower.includes('fire')) return 'fa-solid fa-fire'
  if (lower.includes('turbo') || lower.includes('sport')) return 'fa-solid fa-futbol'
  if (lower.includes('reel') || lower.includes('slot')) return 'fa-solid fa-clover'
  if (lower.includes('pragmatic') || lower.includes('instant')) return 'fa-solid fa-bolt'
  if (lower.includes('habanero')) return 'fa-solid fa-pepper-hot'
  if (lower.includes('dice') || lower.includes('table')) return 'fa-solid fa-dice'
  if (lower.includes('poker') || lower.includes('card')) return 'fa-solid fa-diamond'
  return 'fa-solid fa-gamepad'
}

function getGameActionLabel(game: GameDefinition): string {
  const id = (game.id || '').toLowerCase()
  const name = (game.name || '').toLowerCase()
  if (id.includes('plinko') || name.includes('plinko') || id.includes('drop')) return 'DROP NOW ›'
  if (id.includes('roulette') || name.includes('roulette') || id.includes('wheel') || id.includes('spin') || id.includes('slot')) return 'SPIN NOW ›'
  if (id.includes('soccer') || id.includes('penalty') || id.includes('kick') || name.includes('goal')) return 'KICK NOW ›'
  if (id.includes('crash') || id.includes('aviator') || id.includes('plane') || id.includes('balloon') || name.includes('fly')) return 'FLY NOW ›'
  if (id.includes('mine') || name.includes('mine')) return 'MINE NOW ›'
  if (id.includes('card') || name.includes('card') || id.includes('hi_lo') || id.includes('poker')) return 'DEAL NOW ›'
  return 'PLAY NOW ›'
}

function ProviderLogoItem({
  logo,
  name,
  iconClass,
}: {
  logo?: string | null
  name: string
  iconClass: string
}) {
  const [failed, setFailed] = useState(!logo)

  if (!failed && logo) {
    return (
      <div className="provider-logo-center">
        <img
          className="provider-card-logo"
          src={logo}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className="chamfer-poster-vector">
      <span className="chamfer-monogram">{name.slice(0, 2).toUpperCase()}</span>
      <div className="chamfer-vector-icon">
        <i className={iconClass} style={{ fontSize: '2.5rem', color: '#f5b300' }} />
      </div>
    </div>
  )
}

function GameTile({
  game,
  disabled,
  onSelect,
}: {
  game: GameDefinition
  disabled: boolean
  onSelect: (game: GameDefinition) => void
}) {
  const [failed, setFailed] = useState(false)

  const spribeImage = getSpribeImage(game.name) || getSpribeImage(game.id)
  const effectiveImage = spribeImage || game.image || GAME_FALLBACK_IMAGE

  useEffect(() => {
    setFailed(false)
  }, [game.id, effectiveImage])

  const theme = getCardTheme(game)
  const actionLabel = getGameActionLabel(game)
  const hasValidImage = Boolean(
    effectiveImage &&
      effectiveImage.trim() !== '' &&
      effectiveImage !== 'null' &&
      effectiveImage !== 'undefined' &&
      effectiveImage !== GAME_FALLBACK_IMAGE,
  )

  return (
    <div
      className="chamfer-card-wrapper"
      onClick={() => onSelect(game)}
    >
      <div className={`chamfer-casino-card theme-${theme}${disabled ? ' is-disabled' : ''}`}>
        <div className="chamfer-border-wrap">
          <div className="chamfer-inner-deck">
            <div className="card-top-neon-stripe" />
            <div className="card-top-badge-row">
              <span className="chamfer-badge badge-live">
                {game.payout_label || 'LIVE'}
              </span>
            </div>

            <div className="chamfer-artwork-frame">
              {/* Static placeholder always present underneath */}
              <img
                className="chamfer-poster-img chamfer-placeholder-base"
                src={GAME_FALLBACK_IMAGE}
                alt=""
                aria-hidden="true"
              />
              {/* Live dynamic game image on top */}
              {hasValidImage && !failed && (
                <img
                  className="chamfer-poster-img chamfer-dynamic-img is-loaded"
                  src={effectiveImage}
                  alt={game.name}
                  loading="eager"
                  onError={() => {
                    setFailed(true)
                  }}
                />
              )}
            </div>

            <div className="chamfer-bottom-vignette" />

            <div className="chamfer-content-deck">
              <div className="chamfer-game-title" title={game.name}>{game.name}</div>
              <div className="chamfer-game-subtitle">
                LIVE PROVIDER GAME.
              </div>
              <button
                type="button"
                className="btn-card-action"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(game)
                }}
              >
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



type SpribePickItem = {
  id: string
  name: string
  displayTitle: string
  actionText: string
  image: string
  themeClass: string
}

const SPRIBE_FEATURED_PICKS: SpribePickItem[] = [
  { id: 'dice', name: 'Dice', displayTitle: 'DICE', actionText: 'PLAY NOW ›', image: '/assets/games/SPRIBE/DICE.png', themeClass: 'card-theme-dice' },
  { id: 'goal', name: 'Goal', displayTitle: 'GOAL', actionText: 'KICK NOW ›', image: '/assets/games/SPRIBE/SOCCER.png', themeClass: 'card-theme-goal' },
  { id: 'plinko', name: 'Plinko', displayTitle: 'PLINKO', actionText: 'DROP NOW ›', image: '/assets/games/SPRIBE/PLINKO.png', themeClass: 'card-theme-plinko' },
  { id: 'aviator', name: 'Aviator', displayTitle: 'AVIATOR', actionText: 'FLY NOW ›', image: '/assets/games/SPRIBE/AVIATOR.png', themeClass: 'card-theme-aviator' },
  { id: 'mines', name: 'Mines', displayTitle: 'MINES', actionText: 'MINE NOW ›', image: '/assets/games/SPRIBE/MINES.png', themeClass: 'card-theme-mines' },
  { id: 'miniroulette', name: 'Wheel', displayTitle: 'WHEEL', actionText: 'SPIN NOW ›', image: '/assets/games/SPRIBE/MINIROULETTE.png', themeClass: 'card-theme-wheel' },
  { id: 'balloon', name: 'Balloon', displayTitle: 'BALLOON', actionText: 'PUMP NOW ›', image: '/assets/games/SPRIBE/BALLON.png', themeClass: 'card-theme-balloon' },
  { id: 'hilo', name: 'Hi-Lo', displayTitle: 'HI-LO', actionText: 'GUESS NOW ›', image: '/assets/games/SPRIBE/HILO.png', themeClass: 'card-theme-hilo' },
  { id: 'hotline', name: 'Hotline', displayTitle: 'HOTLINE', actionText: 'LINE NOW ›', image: '/assets/games/SPRIBE/HOTLINE.png', themeClass: 'card-theme-hotline' },
  { id: 'keno', name: 'Keno', displayTitle: 'KENO', actionText: 'PICK NOW ›', image: '/assets/games/SPRIBE/KENO.png', themeClass: 'card-theme-keno' },
  { id: 'keno80', name: 'Keno 80', displayTitle: 'KENO 80', actionText: 'PICK NOW ›', image: '/assets/games/SPRIBE/KENO80.png', themeClass: 'card-theme-keno80' },
  { id: 'pilot', name: 'Pilot', displayTitle: 'PILOT', actionText: 'FLY NOW ›', image: '/assets/games/SPRIBE/PILOT.png', themeClass: 'card-theme-pilot' },
  { id: 'trader', name: 'Trader', displayTitle: 'TRADER', actionText: 'TRADE NOW ›', image: '/assets/games/SPRIBE/trader.png', themeClass: 'card-theme-trader' },
]

type CrashRound = {
  id: string
  code: string
  mult1: string
  mult2: string
  pillType1: 'magenta' | 'purple' | 'indigo' | 'cyan'
  pillType2: 'magenta' | 'purple' | 'indigo' | 'cyan'
}

const INITIAL_CRASH_ROUNDS: CrashRound[] = [
  { id: '#680 747', code: 'ESG 900100', mult1: 'x 50.25', mult2: 'x 10.25', pillType1: 'magenta', pillType2: 'magenta' },
  { id: '#680 747', code: 'ESG 900100', mult1: 'x 40.25', mult2: 'x 75.25', pillType1: 'purple', pillType2: 'purple' },
  { id: '#680 747', code: 'ESG 900100', mult1: 'x 9.25', mult2: 'x 6.25', pillType1: 'indigo', pillType2: 'indigo' },
  { id: '#680 747', code: 'ESG 900100', mult1: 'x 1.58', mult2: 'x 1.30', pillType1: 'cyan', pillType2: 'cyan' },
]

function SpribeFeaturedSlider({
  disabled,
  catalogGames,
  onSelect,
  showCatalog,
  onToggleCatalog,
}: {
  disabled: boolean
  catalogGames: GameDefinition[]
  onSelect: (game: GameDefinition) => void
  showCatalog?: boolean
  onToggleCatalog?: () => void
}) {
  const [rounds, setRounds] = useState<CrashRound[]>(INITIAL_CRASH_ROUNDS)

  useEffect(() => {
    const timer = setInterval(() => {
      setRounds((prev) => {
        const multipliers = [
          { m1: 'x ' + (1 + Math.random() * 3).toFixed(2), m2: 'x ' + (1 + Math.random() * 2).toFixed(2), type: 'cyan' as const },
          { m1: 'x ' + (4 + Math.random() * 10).toFixed(2), m2: 'x ' + (2 + Math.random() * 8).toFixed(2), type: 'indigo' as const },
          { m1: 'x ' + (12 + Math.random() * 40).toFixed(2), m2: 'x ' + (10 + Math.random() * 50).toFixed(2), type: 'purple' as const },
          { m1: 'x ' + (50 + Math.random() * 60).toFixed(2), m2: 'x ' + (8 + Math.random() * 20).toFixed(2), type: 'magenta' as const },
        ]
        const sample = multipliers[Math.floor(Math.random() * multipliers.length)]
        const roundNum = 680740 + Math.floor(Math.random() * 30)
        const formattedId = `#${String(roundNum).slice(0, 3)} ${String(roundNum).slice(3)}`
        const newRound: CrashRound = {
          id: formattedId,
          code: 'ESG 900100',
          mult1: sample.m1,
          mult2: sample.m2,
          pillType1: sample.type,
          pillType2: sample.type,
        }
        return [newRound, ...prev.slice(0, 3)]
      })
    }, 6500)
    return () => clearInterval(timer)
  }, [])

  const resolveGame = (pick: SpribePickItem): GameDefinition => {
    const qName = pick.name.toLowerCase()
    const qId = pick.id.toLowerCase()
    const match = catalogGames.find(
      (g) =>
        g.id.toLowerCase() === qId ||
        g.name.toLowerCase() === qName ||
        (qId === 'miniroulette' && (g.id.toLowerCase().includes('roulette') || g.name.toLowerCase().includes('wheel'))) ||
        (qId === 'keno' && (g.id.toLowerCase().includes('keno') || g.name.toLowerCase().includes('kino'))) ||
        (qId === 'balloon' && (g.id.toLowerCase().includes('ballon') || g.name.toLowerCase().includes('balloon'))) ||
        (qId === 'pilot' && (g.id.toLowerCase().includes('pilot') || g.name.toLowerCase().includes('chicken'))) ||
        (g.provider?.toLowerCase().includes('spribe') && g.name.toLowerCase().includes(qName)),
    )
    if (match) {
      return {
        ...match,
        image: pick.image || match.image,
      }
    }

    return {
      id: pick.id,
      name: pick.displayTitle || pick.name,
      category: 'Crash & Instant',
      description: `Spribe ${pick.name} — live provider game.`,
      payout_label: 'LIVE',
      choices: [],
      icon: '🎮',
      accent: '#ef4444',
      artFrom: '#180838',
      artTo: '#0b041a',
      tagline: 'Spribe',
      kind: 'provider',
      provider: 'Spribe',
      providerKey: 'spribe',
      is_live: true,
      image: pick.image || GAME_FALLBACK_IMAGE,
    }
  }

  const handleLaunchAviator = () => {
    const aviatorPick = SPRIBE_FEATURED_PICKS.find((p) => p.id === 'aviator') || SPRIBE_FEATURED_PICKS[0]
    onSelect(resolveGame(aviatorPick))
  }

  return (
    <div className="spribe-showcase-master mb-3">
      {/* Top Header matching screenshot: 🪙 Spribe Games Types */}
      <div className="spribe-section-top-header">
        <div className="spribe-section-title-wrap">
          <span className="spribe-section-coin-icon">🪙</span>
          <span className="spribe-section-title">Spribe Games Types</span>
          <span className="spribe-header-pill">VERIFIED PROVIDER</span>
        </div>

        {onToggleCatalog ? (
          <button
            type="button"
            className="btn-view-in-catalog"
            onClick={onToggleCatalog}
            title={showCatalog ? 'Hide catalog' : 'View Spribe in catalog'}
          >
            <i className={`fa-solid ${showCatalog ? 'fa-chevron-up' : 'fa-layer-group'} me-1.5`} />
            <span>{showCatalog ? 'Hide Catalog' : 'View In Catalog'}</span>
          </button>
        ) : null}
      </div>

      {/* Main Container: Left Promo Card + Right 6 Large Game Cards */}
      <div className="spribe-showcase-body">
        {/* Left Spribe Games Promo & Live Activity Card */}
        <div className="spribe-showcase-left-card">
          <div className="spribe-promo-header">
            <div className="spribe-promo-badge-row">
              <span className="spribe-promo-live-badge">
                <span className="live-pulse-radar" /> LIVE MULTIPLIERS
              </span>
              <span className="spribe-promo-provably-fair">
                <i className="fa-solid fa-shield-halved me-1" /> FAIR
              </span>
            </div>
            <h4 className="spribe-promo-title">Spribe Games</h4>
            <p className="spribe-promo-desc">
              Unlock the thrill of Aviator, Plinko, and more! Get an exclusive deposit match to boost your play across all Spribe's exhilarating turbo games.
            </p>
          </div>

          <div className="spribe-live-rounds-list">
            {rounds.map((round, idx) => (
              <div key={`${round.id}-${idx}`} className="spribe-live-round-row">
                <div className="spribe-round-info">
                  <div className="spribe-round-top">
                    <i className="fa-solid fa-plane spribe-plane-icon" />
                    <span className="spribe-round-id">{round.id}</span>
                  </div>
                  <span className="spribe-round-hash">{round.code}</span>
                </div>

                <div className="spribe-round-pills">
                  <span className={`spribe-pill pill-${round.pillType1}`}>{round.mult1}</span>
                  <span className={`spribe-pill pill-${round.pillType2}`}>{round.mult2}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="spribe-bet-actions">
            <button
              type="button"
              className="btn-spribe-bet"
              disabled={disabled}
              onClick={handleLaunchAviator}
              title="Launch and Bet on Aviator"
            >
              <span className="btn-bet-label">
                <i className="fa-solid fa-bolt me-1 text-warning" /> Bet
              </span>
              <span className="btn-bet-amt">1.00 USD</span>
            </button>
            <button
              type="button"
              className="btn-spribe-bet"
              disabled={disabled}
              onClick={handleLaunchAviator}
              title="Launch and Bet on Aviator"
            >
              <span className="btn-bet-label">
                <i className="fa-solid fa-bolt me-1 text-warning" /> Bet
              </span>
              <span className="btn-bet-amt">1.00 USD</span>
            </button>
          </div>
        </div>

        {/* Right 6 Large Game Cards Grid (3 columns x 2 rows for TV & Desktop) */}
        <div className="spribe-showcase-grid spribe-showcase-grid-6">
          {SPRIBE_FEATURED_PICKS.map((pick) => {
            const game = resolveGame(pick)

            return (
              <div
                key={pick.id}
                className={`spribe-poster-card ${pick.themeClass}${disabled ? ' is-disabled' : ''}`}
                onClick={() => onSelect(game)}
                title={`Launch ${pick.displayTitle}`}
              >
                {/* Top-Right LIVE Badge matching screenshot */}
                <div className="spribe-poster-badge-row">
                  <span className="spribe-poster-live-tag">LIVE</span>
                </div>

                {/* Center 3D Artwork Poster */}
                <div className="spribe-poster-art-wrap">
                  <img
                    src={pick.image || GAME_FALLBACK_IMAGE}
                    alt={pick.displayTitle}
                    className="spribe-poster-img"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.onerror = null
                      target.src = GAME_FALLBACK_IMAGE
                    }}
                  />
                </div>

                {/* Bottom Deck matching screenshot */}
                <div className="spribe-poster-bottom-deck">
                  <div className="spribe-poster-title">{pick.displayTitle}</div>
                  <div className="spribe-poster-subtitle">LIVE PROVIDER GAME.</div>
                  <button
                    type="button"
                    className="btn-spribe-poster-action"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(game)
                    }}
                  >
                    {pick.actionText}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GameGrid({
  games,
  disabled,
  onSelect,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  games: GameDefinition[]
  disabled: boolean
  onSelect: (game: GameDefinition) => void
  scrollRoot?: HTMLElement | null
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}) {
  return (
    <>
      <div className="winbet-games-grid">
        {games.map((game) => (
          <GameTile key={game.id} game={game} disabled={disabled} onSelect={onSelect} />
        ))}
      </div>
      
      {/* Catalog Bottom Pagination Bar */}
      <div className="catalog-pagination-bar">
        <div className="pagination-count-box">
          <span className="pagination-badge-indicator">
            <i className="fa-solid fa-gamepad me-1.5" />
            Showing <strong className="highlight-gold">{games.length}</strong> Games
          </span>
          {hasMore ? (
            <span className="pagination-sub-tip">
              (First 50 loaded • Click below to load next 50)
            </span>
          ) : null}
        </div>

        <div className="pagination-action-wrap">
          {hasMore ? (
            <button
              type="button"
              className="btn-view-more-games btn-gold-chamfer"
              disabled={loadingMore}
              onClick={onLoadMore}
            >
              {loadingMore ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin me-2" />
                  <span>Loading next 50 games…</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-layer-group me-2" />
                  <span className="btn-main-label">VIEW NEXT 50 GAMES (+50)</span>
                </>
              )}
            </button>
          ) : games.length > 0 ? (
            <div className="all-loaded-pill">
              <i className="fa-solid fa-circle-check text-success me-2" />
              <span>
                All <strong className="text-warning mx-1">{games.length}</strong> Live Games Loaded
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

function LiveCasinoGameModal({
  game,
  disabled,
  onClose,
  onLaunch,
}: {
  game: GameDefinition
  disabled: boolean
  onClose: () => void
  onLaunch: (game: GameDefinition) => void
}) {
  const [failed, setFailed] = useState(false)
  const spribeImage = getSpribeImage(game.name) || getSpribeImage(game.id)
  const effectiveImage = spribeImage || game.image || GAME_FALLBACK_IMAGE

  useEffect(() => {
    setFailed(false)
  }, [game.id, effectiveImage])

  const hasValidImage = Boolean(
    effectiveImage &&
      effectiveImage.trim() !== '' &&
      effectiveImage !== 'null' &&
      effectiveImage !== 'undefined' &&
      effectiveImage !== GAME_FALLBACK_IMAGE,
  )

  return (
    <div className="kx-alert-backdrop winbet-modal-backdrop" onClick={onClose}>
      <div
        className="live-casino-game-modal-card animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="btn-modal-close-x" onClick={onClose} title="Close">
          <i className="fa-solid fa-xmark" />
        </button>

        <div className="modal-game-poster-section">
          {/* Static placeholder underneath */}
          <img
            src={GAME_FALLBACK_IMAGE}
            alt=""
            className="modal-game-poster-img modal-placeholder-base"
          />
          {/* Dynamic image on top */}
          {hasValidImage && !failed && (
            <img
              src={effectiveImage}
              alt={game.name}
              className="modal-game-poster-img modal-dynamic-img is-loaded"
              loading="eager"
              onError={() => setFailed(true)}
            />
          )}
          <div className="modal-poster-overlay-badge">
            <span className="chamfer-badge badge-live">
              {game.payout_label || 'LIVE'}
            </span>
          </div>
        </div>

        <div className="modal-game-details-section">
          <div className="modal-game-header">
            <h2 className="modal-game-title">{game.name}</h2>
            <div className="modal-game-subtitle">LIVE PROVIDER GAME.</div>
          </div>

          <div className="modal-game-info-chips">
            <div className="game-info-chip">
              <span className="chip-label">PROVIDER</span>
              <span className="chip-value highlight-purple">{game.provider || 'SPRIBE'}</span>
            </div>
            <div className="game-info-chip">
              <span className="chip-label">CATEGORY</span>
              <span className="chip-value">{game.category || 'LIVE CASINO'}</span>
            </div>
            <div className="game-info-chip">
              <span className="chip-label">STATUS</span>
              <span className="chip-value highlight-green">● ONLINE</span>
            </div>
          </div>

          <div className="modal-game-actions">
            <button
              type="button"
              className="btn-modal-launch-primary"
              disabled={disabled}
              onClick={() => {
                onClose()
                onLaunch(game)
              }}
            >
              <i className="fa-solid fa-play me-2" />
              <span>PLAY NOW ›</span>
            </button>
            <button
              type="button"
              className="btn-modal-cancel-secondary"
              onClick={onClose}
            >
              <span>BACK TO LOBBY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BettingLobby({
  disabled,
  onSelect,
  waitingForCoins = false,
  cashOutPending = false,
  offline = false,
  playSlot,
  onLeaveGame,
}: Props) {
  const [activeTab, setActiveTab] = useState<LobbyTab>('spribe')
  const [selectedProviderKey, setSelectedProviderKey] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [previewGame, setPreviewGame] = useState<GameDefinition | null>(null)
  const [showCatalog, setShowCatalog] = useState(false)
  const paneRef = useRef<HTMLDivElement>(null)
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null)

  const { config } = useMachine()
  const stored = loadTerminal()
  const pcName = stored?.pcName || config?.PC_Name || config?.Terminal_ID || 'DEVCITY-PC-002'
  const siteName = stored?.siteName || config?.Site_Name || 'dev'

  const {
    providers,
    gamesByProvider,
    gamesLoading,
    gamesLoadingMore,
    gamesError,
    loadProviderGames,
    loadMoreProviderGames,
    providerHasMore,
    allGames,
    allPage,
    allLoading,
    allLoadingMore,
    allError,
    allHasMore,
    loadAllGames,
    loadMoreAllGames,
  } = useShopProviders()

  useEffect(() => {
    setScrollRoot(paneRef.current)
  }, [activeTab, selectedProviderKey, playSlot])

  // Initial load for all games
  useEffect(() => {
    if (allPage === 0 && !allLoading && !allError) {
      void loadAllGames(1)
    }
  }, [allPage, allLoading, allError, loadAllGames])

  const selectedProvider: LobbyProvider | null = useMemo(() => {
    if (!selectedProviderKey) return null
    return providers.find((item) => item.key === selectedProviderKey) ?? null
  }, [providers, selectedProviderKey])

  // Handle switching tabs
  const handleTabChange = (tab: LobbyTab) => {
    setActiveTab(tab)
    setSelectedProviderKey(null)
    onLeaveGame?.()
  }

  const resetFilters = () => {
    setActiveTab('spribe')
    setSelectedProviderKey(null)
    setSearchQuery('')
    onLeaveGame?.()
  }

  // Base games list
  const baseGamesList = useMemo(() => {
    if (selectedProvider) {
      return gamesByProvider[selectedProvider.name] ?? []
    }
    if (allGames.length > 0) {
      return allGames
    }
    return HOME_GAMES
  }, [selectedProvider, gamesByProvider, allGames])

  // Filter games based on category tab & search HUD
  const filteredGames = useMemo(() => {
    let list = baseGamesList

    if (!selectedProvider) {
      if (activeTab === 'spribe') {
        const map = new Map<string, GameDefinition>()
        // 1. Seed with the 14 guaranteed static Spribe games (all with local /assets/games/SPRIBE/ images)
        SPRIBE_CATALOG_GAMES.forEach((g) => map.set(g.id.toLowerCase(), g))

        // 2. If list contains API games for Spribe, merge launcher data without overwriting the static image
        list.forEach((g) => {
          const prov = (g.provider || '').toLowerCase()
          const tag = (g.tagline || '').toLowerCase()
          const id = (g.id || '').toLowerCase()
          const name = (g.name || '').toLowerCase()
          const isSpribe =
            prov.includes('spribe') ||
            tag.includes('spribe') ||
            id.includes('spribe') ||
            name.includes('aviator') ||
            name.includes('plinko') ||
            name.includes('mines') ||
            name.includes('goal') ||
            name.includes('hilo') ||
            name.includes('hotline') ||
            name.includes('balloon') ||
            name.includes('keno') ||
            name.includes('pilot') ||
            name.includes('trader') ||
            name.includes('crash')

          if (!isSpribe) return

          const cleanName = name.replace(/[^a-z0-9]/g, '')
          let matchedKey: string | undefined
          for (const [key, val] of map.entries()) {
            if (key === id || val.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanName) {
              matchedKey = key
              break
            }
          }

          const staticImg = getSpribeImage(g.name) || getSpribeImage(g.id)
          if (matchedKey) {
            const existing = map.get(matchedKey)!
            map.set(matchedKey, {
              ...existing,
              ...g,
              image: staticImg || existing.image,
              kind: 'provider',
              provider: 'Spribe',
            })
          } else {
            map.set(id, {
              ...g,
              image: staticImg || g.image || GAME_FALLBACK_IMAGE,
              kind: 'provider',
              provider: 'Spribe',
            })
          }
        })
        list = Array.from(map.values())
      } else if (activeTab === 'slots') {
        list = list.filter((g) => (g.category || '').toLowerCase().includes('slot') || (g.name || '').toLowerCase().includes('spin') || (g.name || '').toLowerCase().includes('reel'))
      } else if (activeTab === 'crash') {
        list = list.filter((g) => (g.category || '').toLowerCase().includes('crash') || (g.category || '').toLowerCase().includes('instant') || (g.name || '').toLowerCase().includes('aviator') || (g.name || '').toLowerCase().includes('rocket') || (g.name || '').toLowerCase().includes('balloon'))
      } else if (activeTab === 'live') {
        list = list.filter((g) => g.is_live || (g.category || '').toLowerCase().includes('live') || (g.provider || '').toLowerCase().includes('live'))
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (g) =>
          (g.name || '').toLowerCase().includes(q) ||
          (g.provider || '').toLowerCase().includes(q) ||
          (g.category || '').toLowerCase().includes(q),
      )
    }

    return list
  }, [baseGamesList, selectedProvider, activeTab, searchQuery])

  const totalCatalogCount = Math.max(24, allGames.length || 24)

  const statusMessage = cashOutPending
    ? 'Cash-out pending — collect at the cashier. Games are locked.'
    : offline
      ? 'Connection lost — waiting to reconnect…'
      : waitingForCoins
        ? 'Waiting for cash-in — insert a note or scan a credit ticket.'
        : null

  const isCurrentProviderLoading = selectedProvider
    ? gamesLoading && (gamesByProvider[selectedProvider.name]?.length ?? 0) === 0
    : allLoading && allGames.length === 0

  const isCurrentProviderLoadingMore = selectedProvider ? gamesLoadingMore : allLoadingMore

  const currentHasMore = selectedProvider
    ? providerHasMore(selectedProvider.name) && !searchQuery.trim()
    : allHasMore && !searchQuery.trim()

  const handleLoadMore = () => {
    if (selectedProvider) {
      loadMoreProviderGames(selectedProvider.name)
    } else {
      loadMoreAllGames()
    }
  }

  return (
    <div className={`winbet-casino-catalog-wrapper container-fluid px-2 px-md-3 py-2${disabled ? ' game-lobby-disabled' : ''}`}>
      {/* Kiosk status banner if waiting for cash or offline */}
      {statusMessage && !playSlot ? (
        <div
          className={`lobby-status-banner mb-3${cashOutPending ? ' is-cashout' : ''}${offline ? ' is-offline' : ''}${waitingForCoins ? ' is-waiting' : ''}`}
          role="status"
        >
          {statusMessage}
        </div>
      ) : null}

      {/* AUTO-MOVING 3-BANNER SWIPER SECTION (ABOVE SPRIBE GAMES TYPES) */}
      {!playSlot ? (
        <TopPromoBannerSlider
          disabled={disabled}
          catalogGames={allGames.length > 0 ? allGames : HOME_GAMES}
          onSelect={onSelect}
        />
      ) : null}

      {/* FEATURED LIVE PROVIDER PICKS (SPRIBE GAMES TYPES) */}
      {!playSlot ? (
        <SpribeFeaturedSlider
          disabled={disabled}
          catalogGames={allGames.length > 0 ? allGames : HOME_GAMES}
          onSelect={onSelect}
          showCatalog={showCatalog}
          onToggleCatalog={() => {
            setShowCatalog((prev) => {
              const next = !prev
              if (next) {
                setTimeout(() => {
                  const el = document.getElementById('categoryTabs')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
              return next
            })
          }}
        />
      ) : null}

      {/* Active Play Overlay Slot */}
      {playSlot ? (
        <div className="catalog-master-card">
          <div className="lobby-pane lobby-pane-play">{playSlot}</div>
        </div>
      ) : null}

      {/* LIVE CASINO CATALOG (2nd Image Section — Hidden by default) */}
      {!playSlot && showCatalog ? (
        <div className="catalog-master-card">
        {/* Top Banner (Live Casino Catalog Header) */}
        <div className="catalog-top-banner">
          <div className="catalog-banner-title">
            <span className="catalog-icon">
              <i className="fa-solid fa-layer-group"></i>
            </span>
            <span>LIVE CASINO CATALOG</span>
          </div>

          <div className="catalog-banner-actions">
            <span className="all-games-badge">
              All Games ({totalCatalogCount})
            </span>
            <button
              type="button"
              className="btn-catalog-reset"
              onClick={resetFilters}
            >
              <i className="fa-solid fa-rotate-right me-1"></i> Reset
            </button>
          </div>
        </div>

        {/* Category Nav Bar with All Categories & Integrated Search HUD (Exact Match to Screenshot) */}
        <div className="category-nav-bar">
          <div className="category-scroll-container" id="categoryTabs">
            {/* 1. ALL GAMES */}
            <div
              className={`cat-pill${activeTab === 'all' && !selectedProviderKey ? ' active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              <i className="fa-solid fa-table-cells-large"></i>
              <span>ALL GAMES</span>
            </div>

            {/* 2. SPRIBE (Initially Active) */}
            <div
              className={`cat-pill${activeTab === 'spribe' ? ' active' : ''}`}
              onClick={() => handleTabChange('spribe')}
            >
              <i className="fa-solid fa-plane"></i>
              <span>SPRIBE</span>
            </div>

            {/* 3. PROVIDERS */}
            <div
              className={`cat-pill${activeTab === 'providers' ? ' active' : ''}`}
              onClick={() => handleTabChange('providers')}
            >
              <i className="fa-solid fa-layer-group"></i>
              <span>PROVIDERS</span>
            </div>

            {/* 4. SLOTS */}
            <div
              className={`cat-pill${activeTab === 'slots' ? ' active' : ''}`}
              onClick={() => handleTabChange('slots')}
            >
              <i className="fa-solid fa-clover"></i>
              <span>SLOTS</span>
            </div>

            {/* 5. CRASH & INSTANT */}
            <div
              className={`cat-pill${activeTab === 'crash' ? ' active' : ''}`}
              onClick={() => handleTabChange('crash')}
            >
              <i className="fa-solid fa-bolt"></i>
              <span>CRASH &amp; INSTANT</span>
            </div>

            {/* 6. LIVE CASINO */}
            <div
              className={`cat-pill${activeTab === 'live' ? ' active' : ''}`}
              onClick={() => handleTabChange('live')}
            >
              <i className="fa-solid fa-tower-broadcast"></i>
              <span>LIVE CASINO</span>
            </div>
          </div>

          {/* Integrated Search Bar & Game Count HUD */}
          <div className="d-flex align-items-center gap-3 ms-auto mt-2 mt-md-0">
            <div className="search-box-station">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                id="gameSearchInput"
                placeholder="Search live games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {statusMessage ? (
          <div
            className={`lobby-status-banner${cashOutPending ? ' is-cashout' : ''}${offline ? ' is-offline' : ''}${waitingForCoins ? ' is-waiting' : ''}`}
            role="status"
          >
            {statusMessage}
          </div>
        ) : null}

        {/* Active Play Overlay Slot */}
        {playSlot ? <div className="lobby-pane lobby-pane-play">{playSlot}</div> : null}

        {/* Main View Pane */}
        {!playSlot ? (
          <div className="lobby-pane" ref={paneRef}>
          {/* PROVIDERS GALLERY VIEW */}
          {activeTab === 'providers' && !selectedProviderKey ? (
            <div className="winbet-games-grid">
              {providers.map((prov) => {
                const iconClass = getProviderIcon(prov.name)
                return (
                  <div
                    key={prov.key}
                    className="chamfer-card-wrapper"
                    onClick={() => {
                      setSelectedProviderKey(prov.key)
                      if (!(gamesByProvider[prov.name]?.length)) {
                        void loadProviderGames(prov.name, 1)
                      }
                    }}
                  >
                    <div className="chamfer-casino-card theme-purple">
                      <div className="chamfer-border-wrap">
                        <div className="chamfer-inner-deck">
                          <div className="card-top-neon-stripe" />
                          <div className="card-top-badge-row">
                            <span className="chamfer-badge badge-hot">PROVIDER</span>
                          </div>

                          <div className="chamfer-artwork-frame">
                            <ProviderLogoItem logo={prov.logo} name={prov.name} iconClass={iconClass} />
                          </div>

                          <div className="chamfer-bottom-vignette" />

                          <div className="chamfer-content-deck">
                            <div className="chamfer-game-title">{prov.name}</div>
                            <div className="chamfer-game-subtitle">OFFICIAL PROVIDER</div>
                            <button
                              type="button"
                              className="btn-chamfer-neon-pill"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProviderKey(prov.key)
                                if (!(gamesByProvider[prov.name]?.length)) {
                                  void loadProviderGames(prov.name, 1)
                                }
                              }}
                            >
                              VIEW GAMES ›
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* GAMES VIEW (ALL, SELECTED PROVIDER, OR CATEGORY) */
            <>
              {activeTab === 'providers' && selectedProvider ? (
                <div className="lobby-header-row">
                  <button
                    type="button"
                    className="btn-catalog-reset"
                    onClick={() => setSelectedProviderKey(null)}
                  >
                    <i className="fa-solid fa-arrow-left me-1"></i> Back to Providers
                  </button>
                  <h3 className="provider-active-title">
                    <span>{selectedProvider.name}</span>
                    <span className="provider-game-count-tag">
                      {filteredGames.length} Games
                    </span>
                  </h3>
                </div>
              ) : null}

              {isCurrentProviderLoading ? (
                <p className="lobby-empty">
                  Loading {selectedProvider ? `${selectedProvider.name} games…` : 'games…'}
                </p>
              ) : (selectedProvider ? gamesError : allError) && filteredGames.length === 0 ? (
                <p className="lobby-empty">
                  {selectedProvider ? gamesError : allError}
                </p>
              ) : filteredGames.length === 0 ? (
                <div className="no-live-games-card">
                  <div className="no-live-games-icon-wrap">
                    <i className="fa-solid fa-gamepad"></i>
                  </div>
                  <h2 className="no-live-games-title">No Live Games Found</h2>
                  <p className="no-live-games-subtitle">
                    {searchQuery.trim()
                      ? `No live games matching "${searchQuery}". Try another keyword or filter.`
                      : selectedProvider
                        ? `No live games found for ${selectedProvider.name}. Try another category or filter.`
                        : 'No live games matching this filter. Try another keyword or filter.'}
                  </p>
                  <button
                    type="button"
                    className="btn-show-all-live-games"
                    onClick={resetFilters}
                  >
                    Show All Games
                  </button>
                </div>
              ) : (
                <GameGrid
                  games={filteredGames}
                  disabled={disabled}
                  onSelect={onSelect}
                  scrollRoot={scrollRoot}
                  hasMore={currentHasMore}
                  loadingMore={isCurrentProviderLoadingMore}
                  onLoadMore={handleLoadMore}
                />
              )}
            </>
          )}
        </div>
      ) : null}
      </div>
      ) : null}

      {!playSlot ? (
        <>
          {/* ==========================================================================
              3. NEED HELP / CASH BALANCE TOP-UP BANNER (Separate Card)
              ========================================================================== */}
          <div className="kiosk-help-banner mt-4">
            <div className="help-icon-wrap">
              <i className="fa-solid fa-headset"></i>
            </div>
            <div className="help-content">
              <div className="help-title">Need Help or Cash Balance Top-Up?</div>
              <div className="help-desc">
                Approach the {siteName} Cashier Counter with your Terminal Station Number (<strong className="text-warning">{pcName}</strong>) for instant deposit, session top-up, or cashout assistance.
              </div>
            </div>
            <div className="help-badges-row">
              <span className="help-pill">
                CERTIFIED FAIR RNG
              </span>
              <span className="help-pill pill-gold">
                <i className="fa-solid fa-bolt me-1"></i> INSTANT PAYOUTS
              </span>
              <span className="help-pill pill-cyan">
                <i className="fa-solid fa-lock me-1"></i> STATION ENCRYPTED
              </span>
            </div>
          </div>

          {/* ==========================================================================
              4. WINBET FOOTER SECTION WITH ACTION BAR (Exact Match to Concept)
              ========================================================================== */}
        
        </>
      ) : null}

      {previewGame ? (
        <LiveCasinoGameModal
          game={previewGame}
          disabled={disabled}
          onClose={() => setPreviewGame(null)}
          onLaunch={(g) => {
            setPreviewGame(null)
            onSelect(g)
          }}
        />
      ) : null}
    </div>
  )
}
