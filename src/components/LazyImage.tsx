import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  pixelated?: boolean;
  className?: string;
  style?: React.CSSProperties;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export default function LazyImage({ src, alt, pixelated = true, className, style, ...props }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Reset state on image change
    setIsLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-brand-dark flex items-center justify-center select-none">
      {/* Retro Dither/Grid Loader Placeholder */}
      <AnimatePresence mode="popLayout">
        {!isLoaded && !error && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-brand-charcoal/95 border border-brand-cream/5"
          >
            {/* Visual Scanline styling */}
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-brand-cream/5 to-transparent bg-[size:100%_4px] opacity-20 pointer-events-none" />
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center">
                {/* Vintage spinning pixel square */}
                <div className="w-8 h-8 border-2 border-dashed border-brand-red animate-spin rounded-md" />
                <Cpu className="w-3.5 h-3.5 text-brand-cream/60 absolute animate-pulse" />
              </div>
              <span className="font-mono text-[8px] tracking-widest text-brand-cream/40 uppercase animate-pulse">
                loading chips...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`${className || ''} w-full h-full object-cover transition-all duration-700 ease-out ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-98 blur-xs'
        }`}
        style={{
          imageRendering: pixelated ? 'pixelated' : 'auto',
          ...style,
        }}
        {...props}
      />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-dark text-brand-cream/50 p-4 text-center z-10">
          <span className="font-pixel text-[8px] text-brand-red uppercase mb-1">IMAGE OFFLINE</span>
          <span className="font-sans text-[10px] text-brand-cream/35">Could not fetch artwork</span>
        </div>
      )}
    </div>
  );
}
