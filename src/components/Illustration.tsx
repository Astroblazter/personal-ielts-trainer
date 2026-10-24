const ILLUSTRATIONS = {
  hero: '/hero-village.webp',
  lesson: '/lesson-morning.webp',
  grammar: '/grammar-workshop.webp',
  mistakes: '/mistakes-fixing.webp',
  vocabulary: '/vocabulary-collection.webp',
  reading: '/reading-garden.webp',
  listening: '/listening-world.webp',
  writing: '/writing-letter.webp',
  speaking: '/speaking-tea.webp',
  mock: '/mock-castle.webp',
  progress: '/progress-tree.webp',
  settings: '/settings-desk.webp',
  emptyVocab: '/empty-vocab.webp',
  emptyMistakes: '/empty-mistakes.webp',
  lessonComplete: '/lesson-complete.webp',
} as const;

export type IllustrationKey = keyof typeof ILLUSTRATIONS;

type Size = 'hero' | 'page' | 'inline' | 'thumb';

const SIZE_CLASSES: Record<Size, string> = {
  hero: 'w-full max-w-[560px] aspect-[16/10]',
  page: 'w-full max-w-[420px] aspect-[16/10]',
  inline: 'w-full max-w-[280px] aspect-[16/10]',
  thumb: 'w-24 h-24',
};

interface IllustrationProps {
  name: IllustrationKey;
  size?: Size;
  alt?: string;
  className?: string;
}

export function Illustration({
  name,
  size = 'page',
  alt = '',
  className = '',
}: IllustrationProps) {
  const src = ILLUSTRATIONS[name];
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${SIZE_CLASSES[size]} object-contain ${className}`}
    />
  );
}
