import { notFound } from 'next/navigation';
import { PRESENTATION_DATA } from '@/lib/presentationData';
import SlideWrapper from '@/components/presentation/SlideWrapper';

// Optimize build output (Static Site Generation for slides)
export function generateStaticParams() {
    return PRESENTATION_DATA.map((slide) => ({
        slug: slide.slug,
    }));
}

export default async function SlidePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const slideIndex = PRESENTATION_DATA.findIndex(s => s.slug === slug);
    const slide = PRESENTATION_DATA[slideIndex];

    if (!slide) {
        notFound();
    }

    return <SlideWrapper slide={slide} index={slideIndex} />;
}
