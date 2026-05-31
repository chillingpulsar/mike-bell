import { isTauri } from '@tauri-apps/api/core';
import type { SoundIds } from '$lib/types';
import type { KeyboardGroupId } from '$lib/keyboard-groups';

export interface SoundPrefs {
	keyboardGroups: Record<KeyboardGroupId, { sound: SoundIds; volume: number }>;
	mouseLeft: { sound: SoundIds; volume: number };
	mouseRight: { sound: SoundIds; volume: number };
}

const STORE_NAME = 'prefs.json';
const PREFS_KEY = 'sound_prefs';

/**
 * Load saved sound preferences from the Tauri store.
 * Returns null if no saved prefs exist (caller should fall back to defaults).
 */
export async function loadPrefs(): Promise<SoundPrefs | null> {
	if (!isTauri()) return null;

	try {
		const { LazyStore } = await import('@tauri-apps/plugin-store');
		const store = new LazyStore(STORE_NAME, { defaults: {} });
		const prefs = await store.get<SoundPrefs>(PREFS_KEY);
		return prefs ?? null;
	} catch {
		return null;
	}
}

/**
 * Save sound preferences to the Tauri store.
 */
export async function savePrefs(prefs: SoundPrefs): Promise<void> {
	if (!isTauri()) return;

	try {
		const { LazyStore } = await import('@tauri-apps/plugin-store');
		const store = new LazyStore(STORE_NAME, { defaults: {} });
		await store.set(PREFS_KEY, prefs);
		await store.save();
	} catch (e) {
		console.error('Failed to save preferences:', e);
	}
}
