import { combineResults, severityOf } from '../combineResults';
import type { PartAssessment } from '../../types';

const ass = (
  part: PartAssessment['part'],
  condition: string,
  confidence = 0.9,
): PartAssessment => ({
  part,
  condition: condition as PartAssessment['condition'],
  confidence,
  severity: severityOf(part, condition),
  box: null,
  durationMs: 10,
  backend: 'roboflow',
});

describe('severityOf', () => {
  it('maps conditions to 0..2 severity', () => {
    expect(severityOf('eye', 'clear')).toBe(0);
    expect(severityOf('eye', 'cloudy')).toBe(1);
    expect(severityOf('eye', 'sunken')).toBe(2);
    expect(severityOf('skin', 'firm_shiny')).toBe(0);
    expect(severityOf('skin', 'slimy')).toBe(1);
    expect(severityOf('skin', 'discolored')).toBe(2);
  });

  it('falls back to moderate severity for unknown labels', () => {
    expect(severityOf('eye', 'unknown')).toBe(1);
  });
});

describe('combineResults (severe-wins default)', () => {
  it('fresh eye + slimy skin -> not_fresh driven by the skin', () => {
    const result = combineResults(ass('eye', 'clear'), ass('skin', 'slimy', 0.95));
    expect(result.level).toBe('not_fresh');
    expect(result.eye.condition).toBe('clear');
    expect(result.skin.condition).toBe('slimy');
  });

  it('sunken eye + firm shiny skin -> not_fresh driven by the eye', () => {
    const result = combineResults(ass('eye', 'sunken', 0.8), ass('skin', 'firm_shiny'));
    expect(result.level).toBe('not_fresh');
  });

  it('clear + firm_shiny -> fresh', () => {
    const result = combineResults(ass('eye', 'clear'), ass('skin', 'firm_shiny'));
    expect(result.level).toBe('fresh');
  });

  it('cloudy + slimy (both severity 1) -> not_fresh', () => {
    const result = combineResults(ass('eye', 'cloudy'), ass('skin', 'slimy'));
    expect(result.level).toBe('not_fresh');
  });

  it('reports the worst part confidence', () => {
    const result = combineResults(ass('eye', 'sunken', 0.62), ass('skin', 'firm_shiny', 0.99));
    expect(result.confidence).toBeCloseTo(0.62, 5);
  });
});