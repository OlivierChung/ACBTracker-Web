interface LogoProps {
  size?: number
}

export function LogoMark({ size = 32 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="44" height="44" rx="10" fill="#2563eb"/>
      <path d="M22 5 L25 14 L30 11 L27 18 L36 16 L30 22 L34 22 L22 38 L10 22 L14 22 L8 16 L17 18 L14 11 L19 14 Z" fill="white"/>
      <text x="22" y="27" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="800" fill="#2563eb" textAnchor="middle">$</text>
    </svg>
  )
}

interface LogoFullProps {
  size?: number
  dark?: boolean
}

export function Logo({ size = 32, dark = false }: LogoFullProps) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <div className="flex flex-col leading-none">
        <span className={`font-bold text-base tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
          ACB<span className="text-blue-600">Tracker</span>
        </span>
      </div>
    </div>
  )
}
