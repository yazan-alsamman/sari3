"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SLIDES = [
  {
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1600&q=80",
    caption: "قطع غيار أصلية بين المحلات",
  },
  {
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=80",
    caption: "سيارات وورش في المناطق الصناعية",
  },
  {
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=80",
    caption: "فرامل ومحركات — توصيل سريع",
  },
  {
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=80",
    caption: "دراجة سريع حوش بلاس على الطريق",
  },
];

export function AutoPartsSlideshow() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${slide.image})` }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* gear / part accents */}
      <motion.div
        className="pointer-events-none absolute -left-10 top-24 h-40 w-40 rounded-full border-4 border-red-900/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-8 bottom-40 h-28 w-28 rounded-full border-4 border-dashed border-[#1e3a5f]/70"
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />

      <AnimatePresence mode="wait">
        <motion.p
          key={slide.caption}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute left-4 right-4 top-10 z-10 rounded-2xl border border-white/10 bg-[#0a1628]/55 px-4 py-2 text-center text-sm text-slate-100 backdrop-blur-md"
        >
          {slide.caption}
        </motion.p>
      </AnimatePresence>

      <div className="absolute bottom-36 left-0 right-0 z-10 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`شريحة ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-red-700" : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
