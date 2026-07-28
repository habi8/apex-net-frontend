import Image from 'next/image'

export function Logo({
  size = 96,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <Image
      src="/apex-net-logo.png"
      alt="APEX-Net Logo"
      width={size}
      height={size}
      className={`object-contain ${className ?? ''}`.trim()}
      style={{ width: size, height: 'auto' }}
      priority
    />
  )
}
