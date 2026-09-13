import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

/** A chosen cover image, held in memory until the group is created. */
export type PickedCover = {
  /** Local file URI, for previewing before upload. */
  uri: string;
  base64: string;
  mimeType: string;
};

export type CoverPickerState = {
  cover: PickedCover | null;
  isPicking: boolean;
  error: string | null;
  pick: () => Promise<void>;
  clear: () => void;
};

/**
 * Picks a group cover from the photo library.
 *
 * Requests base64 up front: the upload path in `use-groups` needs it, and
 * asking the picker is far cheaper than re-reading the file afterwards. The
 * 16:9 crop matches the aspect the cover is rendered at, so what the user
 * frames is what they get.
 */
export function useCoverPicker(): CoverPickerState {
  const [cover, setCover] = useState<PickedCover | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = useCallback(async () => {
    setIsPicking(true);
    setError(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError('Ghumi needs access to your photos to set a cover image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.base64) {
        setError('Could not read that image. Try another one.');
        return;
      }

      setCover({
        uri: asset.uri,
        base64: asset.base64,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    } catch {
      setError('Could not open your photo library.');
    } finally {
      setIsPicking(false);
    }
  }, []);

  const clear = useCallback(() => {
    setCover(null);
    setError(null);
  }, []);

  return { cover, isPicking, error, pick, clear };
}
