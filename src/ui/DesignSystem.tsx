// src/ui/DesignSystem.tsx
import React from 'react';

export type ModuleAccent = 'fx' | 'img' | 'mod' | 'master' | 'default';

export interface ModuleCardProps {
  title: React.ReactNode;
  accent?: ModuleAccent;
  children: React.ReactNode;
  className?: string;
  /**
   * Dimensione titolo: lg = default visibile; md = più piccolo; xl = molto grande.
   */
  titleSize?: 'md' | 'lg' | 'xl';
}

/**
 * Contenitore standard per i moduli (effetti, modulazioni, master, ecc.).
 * - Sfondo scuro semi‑trasparente
 * - Bordo colorato per categoria (accent)
 * - Titolo ben leggibile (più grande di prima)
 */
export function ModuleCard({
  title,
  accent = 'default',
  children,
  className = '',
  titleSize = 'lg',
}: ModuleCardProps) {
  const accentCls = accentClass(accent);

  const titleCls = (() => {
    switch (titleSize) {
      case 'xl':
        return 'text-[18px] sm:text-[20px] font-extrabold tracking-wide uppercase';
      case 'md':
        return 'text-sm font-semibold';
      case 'lg':
      default:
        return 'text-[15px] sm:text-[16px] font-bold leading-tight';
    }
  })();

  return (
    <div
      className={[
        'waff-card relative mb-4 p-3 rounded-md bg-[#1a1a1a]/80 backdrop-blur-sm border transition-colors',
        accentCls,
        className,
      ].join(' ')}
    >
      <h3
        className={[
          'waff-module-title mb-2 flex items-center gap-1 select-none text-white',
          titleCls,
        ].join(' ')}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Accent utilities                                                    */
/* ------------------------------------------------------------------ */
function accentClass(accent: ModuleAccent) {
  switch (accent) {
    case 'fx':
      return 'border-purple-500/50 hover:border-purple-300/70';
    case 'img':
      return 'border-cyan-500/50 hover:border-cyan-300/70';
    case 'mod':
      return 'border-lime-500/50 hover:border-lime-300/70';
    case 'master':
      return 'border-amber-500/50 hover:border-amber-300/70';
    case 'default':
    default:
      return 'border-gray-600/60 hover:border-gray-300/70';
  }
}
