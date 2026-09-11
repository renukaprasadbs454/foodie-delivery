import { Linking, Platform } from 'react-native';
import { buildOsMapsUrl, type OsMapsHandoffArgs } from './osMapsUrl';

export type { OsMapsHandoffArgs } from './osMapsUrl';
export { buildOsMapsUrl } from './osMapsUrl';

/**
 * OS maps deep-link handoff — SD §16.3 (no in-app turn-by-turn).
 * Order §6.2 has no lat/lng — coords optional; Partial OK without inventing fields.
 */
export async function openOsMapsHandoff(
  args: OsMapsHandoffArgs,
): Promise<boolean> {
  const url = buildOsMapsUrl(args, Platform.OS);
  const can = await Linking.canOpenURL(url);
  if (!can) return false;
  await Linking.openURL(url);
  return true;
}
