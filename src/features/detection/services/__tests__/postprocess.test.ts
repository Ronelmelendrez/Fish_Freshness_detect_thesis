import { softmax, argmax, classifyCondition } from '../postprocess';

describe('softmax', () => {
  it('returns probabilities that sum to 1', () => {
    const probs = softmax([2.0, 1.0, 0.1]);
    const sum = Array.from(probs).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it('preserves the argmax ordering', () => {
    const probs = softmax([-1, 3, 0]);
    expect(argmax(probs)).toBe(1);
  });

  it('is stable for large logits (no NaN)', () => {
    const probs = softmax([1000, 999]);
    expect(Number.isNaN(probs[0])).toBe(false);
    expect(probs[0]).toBeGreaterThan(probs[1]);
  });
});

describe('classifyCondition', () => {
  it('returns the argmax label, softmaxing raw scores to get confidence', () => {
    const result = classifyCondition('eye', [0.2, 0.7, 0.1], 'roboflow');
    expect(result.condition).toBe('cloudy');
    expect(result.confidence).toBeCloseTo(0.464, 3);
  });

  it('maps skin class order firm_shiny, slimy, discolored', () => {
    const result = classifyCondition('skin', [0.1, 0.1, 0.8], 'tflite');
    expect(result.condition).toBe('discolored');
  });
});