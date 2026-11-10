import type { FrameReading } from '@/features/detection/types';
import { createStabilityTracker, type StabilityTracker } from '../useStableReading';

const reading = (part: FrameReading['part'], condition: string, confidence: number): FrameReading => ({
  part,
  condition,
  confidence,
  box: null,
  latencyMs: 5,
  backend: 'roboflow',
  timestamp: 0,
});

const assertRun = (tracker: StabilityTracker, condition: string, times: number, confidence = 0.9) => {
  for (let i = 0; i < times; i++) tracker.emit(reading('eye', condition, confidence));
};

describe('createStabilityTracker', () => {
  it('locks after N consistent, confident frames', () => {
    const tracker = createStabilityTracker('eye', { consecutiveFrames: 3 });
    assertRun(tracker, 'cloudy', 3);
    expect(tracker.locked).toBe(true);
    expect(tracker.progress.ready).toBe(true);
    expect(tracker.progress.count).toBe(3);
  });

  it('does not lock early', () => {
    const tracker = createStabilityTracker('eye', { consecutiveFrames: 5 });
    assertRun(tracker, 'cloudy', 4);
    expect(tracker.locked).toBe(false);
  });

  it('resets the run when a low-confidence frame arrives', () => {
    const tracker = createStabilityTracker('eye', { minConfidence: 0.7, consecutiveFrames: 3 });
    assertRun(tracker, 'cloudy', 2);
    tracker.emit(reading('eye', 'cloudy', 0.3));
    expect(tracker.progress.count).toBe(0);

    assertRun(tracker, 'cloudy', 3);
    expect(tracker.locked).toBe(true);
  });

  it('resets the run when the condition changes', () => {
    const tracker = createStabilityTracker('eye', { consecutiveFrames: 3 });
    assertRun(tracker, 'cloudy', 2);
    tracker.emit(reading('eye', 'clear', 0.9));
    expect(tracker.progress.condition).toBe('clear');
    expect(tracker.progress.count).toBe(1);
  });

  it('ignores readings for the other part', () => {
    const tracker = createStabilityTracker('eye', { consecutiveFrames: 3 });
    tracker.emit(reading('skin', 'slimy', 0.99));
    expect(tracker.progress.count).toBe(0);
    expect(tracker.locked).toBe(false);
  });

  it('calls onLocked once with the winning reading', () => {
    const onLocked = jest.fn();
    const tracker = createStabilityTracker('eye', { consecutiveFrames: 2, onLocked });
    assertRun(tracker, 'sunken', 2);
    assertRun(tracker, 'sunken', 3); // further frames do nothing
    expect(onLocked).toHaveBeenCalledTimes(1);
    expect(onLocked.mock.calls[0][0].condition).toBe('sunken');
  });

  it('reset clears progress and unlocks', () => {
    const tracker = createStabilityTracker('eye', { consecutiveFrames: 2 });
    assertRun(tracker, 'cloudy', 2);
    expect(tracker.locked).toBe(true);
    tracker.reset();
    expect(tracker.locked).toBe(false);
    expect(tracker.progress.count).toBe(0);
  });
});