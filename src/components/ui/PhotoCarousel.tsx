import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { resolveInfoCulturaAssetUrl } from '../../api/client';

export type PhotoCarouselItem = {
  id: string;
  title: string;
  caption?: string;
  image: string;
  alt_text?: string;
};

type PhotoCarouselProps = {
  items: PhotoCarouselItem[];
  className?: string;
  aspectClassName?: string;
};

function PhotoCarousel({
  items,
  className = '',
  aspectClassName = 'aspect-[16/9] md:aspect-[21/9]',
}: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(
    () =>
      items.filter((item) => item.image).map((item) => ({
        ...item,
        imageUrl: resolveInfoCulturaAssetUrl(item.image),
      })),
    [items]
  );

  if (slides.length === 0) {
    return null;
  }

  const activeSlide = slides[Math.min(activeIndex, slides.length - 1)] || slides[0];

  function goToPrevious() {
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  }

  function goToNext() {
    setActiveIndex((current) => (current === slides.length - 1 ? 0 : current + 1));
  }

  return (
    <section className={`space-y-3 ${className}`}>
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
        <div className={`${aspectClassName} relative`}>
          <img
            src={activeSlide.imageUrl}
            alt={activeSlide.alt_text || activeSlide.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-4 text-white">
            <p className="text-lg font-semibold">{activeSlide.title}</p>
            {activeSlide.caption ? <p className="mt-1 text-sm text-white/85">{activeSlide.caption}</p> : null}
          </div>
        </div>

        {slides.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-sm"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-md border ${
                index === activeIndex ? 'border-[#dd8609]' : 'border-slate-200'
              }`}
              aria-label={`Abrir imagem ${index + 1}`}
            >
              <div className="aspect-[4/3]">
                <img
                  src={slide.imageUrl}
                  alt={slide.alt_text || slide.title}
                  className="h-full w-full object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default PhotoCarousel;
