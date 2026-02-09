import { useState, useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { PRESET_COLORS } from '@/components/CategoryIcon';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLS = 6;
const ROWS = 5;
const PER_PAGE = COLS * ROWS;

interface ColorSwipePickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorSwipePicker({ value, onChange }: ColorSwipePickerProps) {
  const pages: string[][] = [];
  for (let i = 0; i < PRESET_COLORS.length; i += PER_PAGE) {
    pages.push(PRESET_COLORS.slice(i, i + PER_PAGE));
  }

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start' });
  const [activeIndex, setActiveIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi, onSelect]);

  // Jump to the page that contains the selected color on mount
  useEffect(() => {
    if (!emblaApi) return;
    const idx = PRESET_COLORS.indexOf(value);
    if (idx >= 0) {
      const page = Math.floor(idx / PER_PAGE);
      emblaApi.scrollTo(page, true);
    }
  }, [emblaApi, value]);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {pages.map((page, pi) => (
            <div key={pi} className="flex-[0_0_100%] min-w-0">
              <div className="grid grid-cols-6 gap-2 px-1">
                {page.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      'flex h-9 w-9 mx-auto items-center justify-center rounded-full transition-all hover:scale-110',
                      value === color && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onChange(color)}
                  >
                    {value === color && <Check className="h-3 w-3 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5">
        {pages.map((_, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              i === activeIndex ? 'bg-primary scale-110' : 'bg-muted-foreground/40'
            )}
            onClick={() => emblaApi?.scrollTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
