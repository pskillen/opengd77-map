import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import PercentLevelSlider, {
  formatPercentLevelLabel,
  snapPercentToStep,
} from './PercentLevelSlider.tsx';
import { theme } from '../../theme.ts';

function Harness({
  initial = null as number | null,
  zeroLabel,
}: {
  initial?: number | null;
  zeroLabel?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <PercentLevelSlider label="Power" value={value} onChange={setValue} zeroLabel={zeroLabel} />
  );
}

describe('PercentLevelSlider helpers', () => {
  it('snaps to step', () => {
    expect(snapPercentToStep(12)).toBe(10);
    expect(snapPercentToStep(13)).toBe(15);
  });

  it('formats labels', () => {
    expect(formatPercentLevelLabel(null)).toBe('Radio default');
    expect(formatPercentLevelLabel(10)).toBe('10%');
    expect(formatPercentLevelLabel(0, { zeroLabel: 'Open (0%)' })).toBe('Open (0%)');
  });
});

describe('PercentLevelSlider', () => {
  it('renders imported percent in label', () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Harness initial={10} />
      </MantineProvider>,
    );
    expect(screen.getByText(/— 10%/)).toBeInTheDocument();
  });

  it('toggles radio default', () => {
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Harness initial={10} />
      </MantineProvider>,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Radio default' }));
    expect(screen.getByText(/— Radio default/)).toBeInTheDocument();
  });

  it('calls onChange with null when default checked', () => {
    const onChange = vi.fn();
    render(
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <PercentLevelSlider label="Squelch" value={25} onChange={onChange} />
      </MantineProvider>,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Radio default' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
