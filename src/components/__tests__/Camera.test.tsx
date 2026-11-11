import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Camera } from '../Camera';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const fakeStream = () => { const stop = vi.fn(); return { stop, stream: { getTracks: () => [{ stop }] } as unknown as MediaStream }; };
function mockCamera(getUserMedia: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
}
describe('camera lifecycle', () => {
  it('stops active tracks when unmounted', async () => {
    const { stream, stop } = fakeStream();
    mockCamera(vi.fn().mockResolvedValue(stream));
    const view = render(<Camera open onClose={() => {}} onCapture={() => {}} />);
    await waitFor(() => expect(view.container.querySelector('video')?.srcObject).toBe(stream));
    view.unmount();
    expect(stop).toHaveBeenCalled();
  });
  it('stops tracks if permission resolves after unmount', async () => {
    const { stream, stop } = fakeStream();
    let resolve: (s: MediaStream) => void = () => {};
    mockCamera(vi.fn(() => new Promise<MediaStream>(r => { resolve = r; })));
    const view = render(<Camera open onClose={() => {}} onCapture={() => {}} />);
    view.unmount();
    await act(async () => { resolve(stream); });
    expect(stop).toHaveBeenCalledTimes(1);
  });
  it('requests only one stream when opened', async () => {
    const getUserMedia = vi.fn().mockResolvedValue(fakeStream().stream);
    mockCamera(getUserMedia);
    render(<Camera open onClose={() => {}} onCapture={() => {}} />);
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));
  });
});
