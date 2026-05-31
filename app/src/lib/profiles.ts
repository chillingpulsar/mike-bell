/**
 * Profile system: save, load, and switch between named sound configurations.
 */

import type { SoundIds } from '$lib/types';
import type { KeyboardGroupId } from '$lib/keyboard-groups';
import { isTauri } from '@tauri-apps/api/core';

export interface SoundProfile {
	name: string;
	builtin?: boolean;
	keyboardGroups: Record<KeyboardGroupId, { sound: SoundIds; volume: number }>;
	mouseLeft: { sound: SoundIds; volume: number };
	mouseRight: { sound: SoundIds; volume: number };
}

const STORE_NAME = 'profiles.json';
const PROFILES_KEY = 'user_profiles';

/** Built-in preset profiles that cannot be deleted. */
export const BUILTIN_PROFILES: SoundProfile[] = [
	{
		name: 'Classic Mechanical',
		builtin: true,
		keyboardGroups: {
			letters: { sound: 'thock', volume: 85 },
			numbers: { sound: 'thock', volume: 80 },
			functionKeys: { sound: 'vault', volume: 76 },
			modifiers: { sound: 'plush', volume: 72 },
			spaceEnter: { sound: 'cream', volume: 88 },
			tabEscape: { sound: 'ink', volume: 78 },
			navigation: { sound: 'velvet', volume: 80 },
			punctuation: { sound: 'bubble', volume: 76 }
		},
		mouseLeft: { sound: 'classic', volume: 82 },
		mouseRight: { sound: 'soft', volume: 78 }
	},
	{
		name: 'Soft and Quiet',
		builtin: true,
		keyboardGroups: {
			letters: { sound: 'velvet', volume: 50 },
			numbers: { sound: 'velvet', volume: 48 },
			functionKeys: { sound: 'wool', volume: 45 },
			modifiers: { sound: 'plush', volume: 42 },
			spaceEnter: { sound: 'cashmere', volume: 55 },
			tabEscape: { sound: 'velvet', volume: 46 },
			navigation: { sound: 'wool', volume: 48 },
			punctuation: { sound: 'velvet', volume: 46 }
		},
		mouseLeft: { sound: 'soft', volume: 50 },
		mouseRight: { sound: 'velvet', volume: 48 }
	},
	{
		name: 'Playful',
		builtin: true,
		keyboardGroups: {
			letters: { sound: 'bubble', volume: 78 },
			numbers: { sound: 'dew', volume: 75 },
			functionKeys: { sound: 'spark', volume: 72 },
			modifiers: { sound: 'honey', volume: 70 },
			spaceEnter: { sound: 'ember', volume: 82 },
			tabEscape: { sound: 'spark', volume: 74 },
			navigation: { sound: 'dew', volume: 76 },
			punctuation: { sound: 'bubble', volume: 74 }
		},
		mouseLeft: { sound: 'bubble', volume: 80 },
		mouseRight: { sound: 'spark', volume: 76 }
	}
];

/**
 * Load user profiles from the Tauri store.
 */
export async function loadProfiles(): Promise<SoundProfile[]> {
	if (!isTauri()) return [];
	try {
		const { LazyStore } = await import('@tauri-apps/plugin-store');
		const store = new LazyStore(STORE_NAME, { defaults: {} });
		const profiles = await store.get<SoundProfile[]>(PROFILES_KEY);
		return profiles ?? [];
	} catch {
		return [];
	}
}

/**
 * Save user profiles to the Tauri store.
 */
export async function saveProfiles(profiles: SoundProfile[]): Promise<void> {
	if (!isTauri()) return;
	try {
		const { LazyStore } = await import('@tauri-apps/plugin-store');
		const store = new LazyStore(STORE_NAME, { defaults: {} });
		await store.set(PROFILES_KEY, profiles);
		await store.save();
	} catch (e) {
		console.error('Failed to save profiles:', e);
	}
}
