import { describe, expect, it, vi, beforeEach } from 'vitest';
import { scrollToPageSection } from './scrollToPageSection.ts';

describe('scrollToPageSection', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('scrolls to an element when present', () => {
    const el = document.createElement('div');
    el.id = 'identity';
    document.body.appendChild(el);

    scrollToPageSection('identity');

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    document.body.removeChild(el);
  });

  it('no-ops when the element is missing', () => {
    expect(() => scrollToPageSection('missing-section')).not.toThrow();
  });
});
