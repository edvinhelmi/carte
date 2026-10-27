/**
 * TasteCode Native Reveal Implementation
 * From packages/design-agent/references/motion/reveal.js
 *
 * Guarantees:
 * - Elements visible by default (no blank screen if JS fails)
 * - Observes individually, unobserves immediately upon entering viewport
 * - Cancels and finishes immediately if prefers-reduced-motion or already above viewport
 * - Zero visible -> hidden -> visible flicker on reload or mid-scroll
 */

export function installReferenceReveals(root: Document | HTMLElement = typeof document !== 'undefined' ? document : ({} as Document)) {
  if (typeof window === 'undefined' || !root.querySelectorAll) return () => {};

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Map<Element, Animation>();
  let active = true;

  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));

  const finish = (element: HTMLElement) => {
    element.dataset.revealPlayed = 'true';
    animations.get(element)?.cancel();
    animations.delete(element);
  };

  const observer =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(
          (entries) => {
            if (!active) return;
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              const element = entry.target as HTMLElement;
              observer?.unobserve(element);
              element.dataset.revealPlayed = 'true';
              if (
                reduced.matches ||
                document.visibilityState === 'hidden' ||
                entry.boundingClientRect.bottom <= 0
              ) {
                finish(element);
              } else {
                animations.get(element)?.play();
              }
            }
          },
          { threshold: 0, rootMargin: '0px 0px 96px 0px' }
        )
      : undefined;

  const stop = () => {
    observer?.disconnect();
    elements.forEach(finish);
  };

  const onPreference = () => {
    if (reduced.matches) stop();
  };
  reduced.addEventListener('change', onPreference);

  for (const element of elements) {
    if (element.dataset.revealPlayed === 'true') continue;
    const rect = element.getBoundingClientRect();

    // Never hide already visible content after first paint or restored scroll
    if (
      reduced.matches ||
      !observer ||
      !element.animate ||
      rect.top < window.innerHeight ||
      document.visibilityState === 'hidden'
    ) {
      finish(element);
      continue;
    }

    const transform =
      element.dataset.reveal === 'media'
        ? 'scale(1.02)'
        : element.dataset.reveal === 'slide'
        ? 'translateX(-10px)'
        : 'translateY(10px)';

    const animation = element.animate(
      [
        { opacity: 0, transform },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' }
    );
    animation.pause();
    animation.onfinish = () => finish(element);
    animations.set(element, animation);
    observer.observe(element);
  }

  return () => {
    active = false;
    observer?.disconnect();
    for (const animation of animations.values()) {
      animation.onfinish = null;
      animation.cancel();
    }
    animations.clear();
    reduced.removeEventListener('change', onPreference);
  };
}
