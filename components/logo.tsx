import Image from 'next/image'

export function Logo({
  size = 96,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      className={`relative inline-block ${className ?? ''}`.trim()}
      style={{ width: size }}
    >
      {/* Light theme logo */}
      <Image
        src="/apex-net-logo.png"
        alt="APEX-Net Logo"
        width={size}
        height={size}
        className="object-contain block dark:hidden"
        style={{ width: size, height: 'auto' }}
        priority
      />
      {/* Dark theme logo */}
      <Image
        src="/logo-dark.png"
        alt="APEX-Net Logo"
        width={size}
        height={size}
        className="object-contain hidden dark:block"
        style={{ width: size, height: 'auto' }}
        priority
      />
    </span>
  )
}