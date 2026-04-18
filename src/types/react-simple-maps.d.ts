declare module 'react-simple-maps' {
  import { ReactNode, MouseEvent } from 'react'

  interface Geography {
    rsmKey: string
    [key: string]: unknown
  }

  interface GeographiesProps {
    geography: string | object
    children: (props: { geographies: Geography[] }) => ReactNode
  }

  interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: object
      hover?: object
      pressed?: object
    }
    [key: string]: unknown
  }

  interface MarkerProps {
    coordinates: [number, number]
    children?: ReactNode
    onClick?: (event: MouseEvent) => void
    [key: string]: unknown
  }

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: { scale?: number; center?: [number, number] }
    style?: object
    children?: ReactNode
  }

  interface ZoomableGroupProps {
    children?: ReactNode
    center?: [number, number]
    zoom?: number
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function ZoomableGroup(props: ZoomableGroupProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
  export function Marker(props: MarkerProps): JSX.Element
}
