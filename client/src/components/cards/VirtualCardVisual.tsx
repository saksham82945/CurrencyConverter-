import React from 'react';
import { VirtualCardDTO } from '@shared/types/account.types';
import { Wifi, Snowflake, Lock } from 'lucide-react';

interface VirtualCardVisualProps {
  card: VirtualCardDTO;
  revealedPan?: string;
  revealedCvv?: string;
  className?: string;
}

export const VirtualCardVisual: React.FC<VirtualCardVisualProps> = ({
  card,
  revealedPan,
  revealedCvv,
  className = ''
}) => {
  const isFrozen = card.status === 'FROZEN';
  const displayPan = revealedPan || card.maskedPan;
  const displayCvv = revealedCvv || card.cvv || '•••';

  return (
    <div
      className={`relative w-full max-w-sm aspect-[1.586/1] rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 select-none ${
        isFrozen
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 opacity-80 filter grayscale-[40%]'
          : card.brand === 'MASTERCARD'
          ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30'
          : 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30'
      } ${className}`}
      style={{
        boxShadow: isFrozen
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          : card.brand === 'MASTERCARD'
          ? '0 15px 35px -5px rgba(99, 102, 241, 0.25), 0 0 15px rgba(99, 102, 241, 0.1)'
          : '0 15px 35px -5px rgba(16, 185, 129, 0.25), 0 0 15px rgba(16, 185, 129, 0.1)'
      }}
    >
      {/* Background Holographic Glow Shapes */}
      <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Persistent Simulated Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] rotate-[-25deg]">
        <span className="text-3xl font-black tracking-widest text-white border-2 border-white px-2">
          SIMULATED CARD
        </span>
      </div>

      {/* Frozen Overlay Badge */}
      {isFrozen && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center z-10 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
            <Snowflake className="w-3.5 h-3.5 animate-spin" />
            CARD FROZEN
          </div>
        </div>
      )}

      {/* Top row: Brand & EMV Chip */}
      <div className="flex items-start justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Metallic EMV Chip */}
          <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-200 via-amber-400 to-amber-100 border border-amber-300 shadow-inner flex flex-col justify-around p-1">
            <div className="w-full h-px bg-amber-600/40" />
            <div className="w-full h-px bg-amber-600/40" />
          </div>
          {/* Contactless symbol */}
          <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
        </div>

        {/* Card Brand */}
        <div className="text-right">
          <span className="text-[11px] font-mono font-extrabold tracking-widest text-white block">
            BANK OF MALDIVES
          </span>
          <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest font-bold">
            BML DEBIT • MALDIVES
          </span>
        </div>
      </div>

      {/* Middle row: Card Number (PAN) */}
      <div className="my-2 z-10">
        <div className="font-mono text-base sm:text-lg tracking-[0.18em] text-white font-bold drop-shadow-md">
          {displayPan}
        </div>
      </div>

      {/* Bottom row: Cardholder, Expiry, CVV & Brand Logo */}
      <div className="flex items-end justify-between z-10">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
            Cardholder
          </span>
          <p className="text-xs sm:text-sm font-semibold text-white tracking-wide uppercase truncate max-w-[140px]">
            {card.cardholderName}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
              Expires
            </span>
            <p className="text-xs sm:text-sm font-mono text-white font-bold">
              {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
            </p>
          </div>

          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
              CVV
            </span>
            <p className="text-xs sm:text-sm font-mono text-white font-bold">
              {displayCvv}
            </p>
          </div>

          {/* Visa / Mastercard circle branding */}
          <div className="pl-1">
            {card.brand === 'MASTERCARD' ? (
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-rose-500/90" />
                <div className="w-6 h-6 rounded-full bg-amber-500/90" />
              </div>
            ) : (
              <span className="font-extrabold italic text-sm text-white tracking-wider">
                VISA
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
