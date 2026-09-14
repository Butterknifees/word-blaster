import React, { useEffect, useState } from 'react';
import type { FlyingTile } from '../../types/game';

interface Props {
  flyingTiles: FlyingTile[];
}

export const BlasterCanvas: React.FC<Props> = ({ flyingTiles }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (flyingTiles.length === 0) return;
    const anim = requestAnimationFrame(() => {
      setNow(Date.now());
    });
    return () => cancelAnimationFrame(anim);
  }, [flyingTiles, now]);

  if (flyingTiles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {flyingTiles.map((tile) => {
        const elapsed = Math.max(0, now - tile.createdAt);
        const progress = Math.min(1, elapsed / tile.durationMs);

        // Ease in out cubic for snappy projectile flight
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Quadratic arc path for visual arc trajectory
        const currentX = tile.startX + (tile.targetX - tile.startX) * ease;
        const arcHeight = -80 * Math.sin(progress * Math.PI);
        const currentY = tile.startY + (tile.targetY - tile.startY) * ease + arcHeight;

        // Scale and rotation
        const rotation = (progress * 720) % 360;
        const scale = 1.0 + Math.sin(progress * Math.PI) * 0.4;
        const opacity = progress >= 0.95 ? (1 - progress) * 20 : 1;

        if (progress >= 1.0) return null;

        return (
          <div
            key={tile.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-black font-game select-none"
            style={{
              left: `${currentX}px`,
              top: `${currentY}px`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
              opacity,
              transition: 'none',
            }}
          >
            {/* Glowing projectile trail / aura */}
            <div
              className="absolute w-12 h-12 rounded-xl blur-md opacity-80"
              style={{
                backgroundColor: tile.color || '#00f0ff',
              }}
            />

            {/* Tile Body */}
            <div
              className="relative w-10 h-10 rounded-xl bg-slate-900 border-2 text-white flex items-center justify-center text-lg font-black shadow-2xl"
              style={{
                borderColor: tile.color || '#00f0ff',
                boxShadow: `0 0 20px ${tile.color || '#00f0ff'}`,
              }}
            >
              {tile.letter}
              <span className="absolute bottom-0.5 right-1 text-[8px] opacity-70">
                🚀
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
