import Image from 'next/image';
import { HOI4_NATIONS, getFlagUrl } from '../lib/hoi4NationsComplete';

interface FlagIconProps {
  tag: string; // Nation tag (e.g., 'GER', 'SOV')
  ideology?: 'communism' | 'democratic' | 'fascism' | 'neutrality';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeMap = {
  small: { width: 24, height: 16 },
  medium: { width: 40, height: 28 },
  large: { width: 64, height: 44 },
};

export default function FlagIcon({ tag, ideology, size = 'medium', className = '' }: FlagIconProps) {
  const flagUrl = getFlagUrl(tag, ideology);
  const nation = HOI4_NATIONS[tag];

  if (!flagUrl || !nation) {
    return (
      <div
        className={`bg-gray-700 rounded border border-gray-600 flex items-center justify-center ${className}`}
        style={{ width: sizeMap[size].width, height: sizeMap[size].height }}
      >
        <span className="text-xs text-gray-400">{tag}</span>
      </div>
    );
  }

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: sizeMap[size].width, height: sizeMap[size].height }}>
      <Image
        src={flagUrl}
        alt={nation.name}
        fill
        className="object-contain rounded border border-gray-600"
        sizes={`${sizeMap[size].width}px`}
        title={`${nation.name} (${tag})`}
      />
    </div>
  );
}
