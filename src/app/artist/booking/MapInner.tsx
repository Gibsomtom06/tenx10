'use client'

import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { Tooltip } from 'react-tooltip'
import type { MapMarket, PlatformScores } from '@/app/api/booking-agent/map-data/route'
import { PLATFORMS } from './MarketMap'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'

type PlatformKey = keyof PlatformScores

function getCircleStyle(market: MapMarket, activePlatform: PlatformKey, isSelected: boolean) {
  const score = market.platform[activePlatform]
  const platform = PLATFORMS.find(p => p.key === activePlatform)
  const color = platform?.color ?? '#888'

  // Size: 4–16px based on audience score, bigger if has shows
  const baseSize = 3 + score * 1.1
  const size = market.showCount > 0 ? baseSize + 2 : baseSize

  // Status ring color
  const ringColors: Record<string, string> = {
    confirmed: '#22c55e',
    active: '#eab308',
    opportunity: '#f97316',
    contact_only: '#60a5fa',
  }
  const ringColor = market.pipelineStatus ? ringColors[market.pipelineStatus] : 'transparent'

  return { size, color, ringColor, score, isSelected }
}

interface Props {
  markets: MapMarket[]
  activePlatform: PlatformKey
  selected: MapMarket | null
  onSelect: (m: MapMarket | null) => void
}

export default function MapInner({ markets, activePlatform, selected, onSelect }: Props) {
  return (
    <>
      <div className="w-full h-[420px] rounded-lg border overflow-hidden bg-slate-950 dark:bg-slate-950">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1100 }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: '#1e3a5f' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {markets.map((market, i) => {
              const { size, color, ringColor, isSelected } = getCircleStyle(
                market, activePlatform, selected?.city === market.city && selected?.state === market.state
              )
              const tooltipId = `market-tip-${i}`

              return (
                <Marker
                  key={`${market.city}-${market.state}`}
                  coordinates={[market.lng, market.lat]}
                  onClick={() => onSelect(selected?.city === market.city ? null : market)}
                  data-tooltip-id={tooltipId}
                >
                  {/* Ring for pipeline status */}
                  {market.pipelineStatus && (
                    <circle
                      r={size + 3}
                      fill="transparent"
                      stroke={ringColor}
                      strokeWidth={1.5}
                      strokeDasharray={market.pipelineStatus === 'opportunity' ? '2 2' : undefined}
                    />
                  )}
                  {/* Main dot */}
                  <circle
                    r={isSelected ? size + 2 : size}
                    fill={color}
                    fillOpacity={0.85}
                    stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.3)'}
                    strokeWidth={isSelected ? 1.5 : 0.5}
                    style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                  />
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltips */}
      {markets.map((market, i) => {
        const score = market.platform[activePlatform]
        const platform = PLATFORMS.find(p => p.key === activePlatform)
        return (
          <Tooltip
            key={i}
            id={`market-tip-${i}`}
            place="top"
            className="!text-xs !py-1 !px-2 !rounded !z-50"
          >
            <div>
              <span className="font-semibold">{market.city}, {market.state}</span>
              {' · '}
              <span style={{ color: platform?.color }}>{platform?.label} {score}/10</span>
              {market.showCount > 0 && ` · ${market.showCount} show${market.showCount > 1 ? 's' : ''}`}
            </div>
          </Tooltip>
        )
      })}
    </>
  )
}
