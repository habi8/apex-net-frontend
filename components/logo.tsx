export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="text-primary">
      <g fill="currentColor">
        <path d="M24 8c-8 0-12 6-12 10v14c0 4 4 8 12 8s12-4 12-8V18c0-4-4-10-12-10z" />
        <path d="M18 18a1 1 0 10-2 0 1 1 0 002 0m6 0a1 1 0 10-2 0 1 1 0 002 0m6 0a1 1 0 10-2 0 1 1 0 002 0" />
      </g>
    </svg>
  )
}
