// Median.co native bridge utility.
// Safe no-op in web browsers and the Lovable editor.

declare global {
  interface Window {
    median_library_ready?: () => void;
    isMedianApp?: boolean;
    median?: any;
  }
}

let initialized = false;

export function initMedianBridge() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.median_library_ready = function () {
    // eslint-disable-next-line no-console
    console.log('Median Native Bridge is ready.');
    window.isMedianApp = true;
  };

  // Median may have injected before this ran.
  if (window.median) {
    window.isMedianApp = true;
  }
}

export function isMedianEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.isMedianApp ||
      (typeof navigator !== 'undefined' && /MedianAndroid|MedianIOS/i.test(navigator.userAgent))
  );
}

/**
 * Try to open the native Median picker. Resolves with a data URL string on success,
 * or `null` if Median is unavailable / errored (caller should fall back to web input).
 */
export async function medianPickImage(type: 'camera' | 'gallery'): Promise<string | null> {
  if (!isMedianEnvironment() || typeof window === 'undefined' || !window.median) {
    return null;
  }

  try {
    const bridge = window.median;
    let result: any;

    if (type === 'camera' && bridge.camera?.takePhoto) {
      result = await bridge.camera.takePhoto();
    } else if (type === 'gallery' && bridge.filePicker?.chooseFile) {
      result = await bridge.filePicker.chooseFile();
    } else {
      return null;
    }

    if (!result) return null;
    if (typeof result === 'string') {
      return result.startsWith('data:') ? result : `data:image/jpeg;base64,${result}`;
    }
    const data = result.data || result.base64 || result.file || result.uri;
    if (typeof data === 'string') {
      return data.startsWith('data:') ? data : `data:image/jpeg;base64,${data}`;
    }
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Median bridge failed, invoking browser fallback:', error);
    return null;
  }
}
