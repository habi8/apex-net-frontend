import Image from 'next/image'

export function Logo({ size = 96 }: { size?: number }) {
  return (
    <Image
      src="/apex-net-logo.png"
      alt="APEX-Net Logo"
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: 'auto' }}
      priority
    />
  )
}
