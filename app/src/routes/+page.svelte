<script lang="ts">
	import './layout.css';
	import { invoke, isTauri } from '@tauri-apps/api/core';
	import { playKeyboard, playMouse } from '$lib/sound-engines';
	import { Textarea } from '$lib/components/internals/textarea/index';
	import DarkMode from '$lib/components/externals/dark-mode/dark-mode.svelte';
	import { ModeWatcher } from 'mode-watcher';
	import type { SoundIds } from '$lib/types';
	import {
		DEFAULT_KEYBOARD_GROUP_PREFS,
		DEFAULT_MOUSE_PREFS,
		KEYBOARD_GROUP_LABELS,
		KEYBOARD_GROUP_ORDER,
		keyboardGroupFromCode,
		keyboardGroupsInvokePayload,
		type KeyboardGroupId
	} from '$lib/keyboard-groups';
	import { loadPrefs, savePrefs } from '$lib/stores';
	import LetsConnect from '$lib/components/externals/lets-connect/lets-connect.svelte';
	import SoundPicker from './(components)/(sound-picker)/sound-picker.svelte';
	import * as Popover from '$lib/components/internals/popover/index';
	import { buttonVariants, Button } from '$lib/components/internals/button';
	import IconSlidersHorizontal from 'phosphor-svelte/lib/SlidersHorizontalIcon';
	import IconPower from 'phosphor-svelte/lib/PowerIcon';
	import IconSpeakerSimpleHigh from 'phosphor-svelte/lib/SpeakerSimpleHighIcon';
	import IconSpeakerSimpleSlash from 'phosphor-svelte/lib/SpeakerSimpleSlashIcon';
	import { Slider } from '$lib/components/internals/slider/index';
	import { ScrollArea } from '$lib/components/internals/scroll-area/index';
	import { onMount } from 'svelte';

	let soundList: { id: SoundIds; name: string }[] = [
		{ id: 'off', name: 'Off' },
		{ id: 'classic', name: 'Classic' },
		{ id: 'soft', name: 'Soft' },
		{ id: 'bubble', name: 'Bubble' },
		{ id: 'vault', name: 'Vault' },
		{ id: 'dew', name: 'Dew' },
		{ id: 'ink', name: 'Ink' },
		{ id: 'spark', name: 'Spark' },
		{ id: 'velvet', name: 'Velvet' },
		{ id: 'wool', name: 'Wool' },
		{ id: 'cocoa', name: 'Cocoa' },
		{ id: 'plush', name: 'Plush' },
		{ id: 'thock', name: 'Thock' },
		{ id: 'cream', name: 'Cream' },
		{ id: 'flannel', name: 'Flannel' },
		{ id: 'ember', name: 'Ember' },
		{ id: 'honey', name: 'Honey' },
		{ id: 'cashmere', name: 'Cashmere' },
		{ id: 'moss', name: 'Moss' }
	];

	let autoStartEnabled = $state(false);

	function toggleAutoStart() {
		if (!isTauri()) return;
		autoStartEnabled = !autoStartEnabled;
		void invoke('set_autostart', { enabled: autoStartEnabled });
	}

	let masterVolume = $state(100);
	let isMuted = $state(false);

	let selectedLeftSoundId = $state<SoundIds>(DEFAULT_MOUSE_PREFS.left.sound);
	let selectedLeftSoundVolume = $state(DEFAULT_MOUSE_PREFS.left.volume);
	let selectedRightSoundId = $state<SoundIds>(DEFAULT_MOUSE_PREFS.right.sound);
	let selectedRightSoundVolume = $state(DEFAULT_MOUSE_PREFS.right.volume);

	let keyboardPrefs = $state<Record<KeyboardGroupId, { sound: SoundIds; volume: number }>>(
		structuredClone(DEFAULT_KEYBOARD_GROUP_PREFS)
	);

	/** Effective volume: per-group volume * master volume * mute factor. */
	function effectiveVolume(groupVolume: number): number {
		if (isMuted) return 0;
		return Math.round(groupVolume * (masterVolume / 100));
	}

	function toggleMute() {
		isMuted = !isMuted;
	}

	// Prevent saving during initial load
	let prefsLoaded = $state(false);

	// Load saved preferences on mount
	onMount(async () => {
		const saved = await loadPrefs();
		if (saved) {
			selectedLeftSoundId = saved.mouseLeft.sound;
			selectedLeftSoundVolume = saved.mouseLeft.volume;
			selectedRightSoundId = saved.mouseRight.sound;
			selectedRightSoundVolume = saved.mouseRight.volume;
			keyboardPrefs = saved.keyboardGroups;
		}
		prefsLoaded = true;
	});

	// Persist preferences reactively whenever they change
	$effect(() => {
		if (!prefsLoaded) return;
		const prefs = {
			keyboardGroups: keyboardPrefs,
			mouseLeft: { sound: selectedLeftSoundId, volume: selectedLeftSoundVolume },
			mouseRight: { sound: selectedRightSoundId, volume: selectedRightSoundVolume }
		};
		void savePrefs(prefs);
	});

	const keyboardSoundCapture = (e: KeyboardEvent) => {
		if (e.repeat) return;
		const group = keyboardGroupFromCode(e.code);
		const pref = keyboardPrefs[group];
		if (pref.sound === 'off') return;

		const isModifierPhysicalKey =
			e.code.startsWith('Control') ||
			e.code.startsWith('Alt') ||
			e.code.startsWith('Meta') ||
			e.code.startsWith('Shift') ||
			e.code === 'CapsLock' ||
			e.code === 'Fn';

		if (!isModifierPhysicalKey && (e.metaKey || e.ctrlKey || e.altKey)) return;

		playKeyboard(pref.sound, effectiveVolume(pref.volume));
	};

	const onMouseDownCapture = (e: MouseEvent) => {
		if (e.button === 0) {
			if (selectedLeftSoundId === 'off') return;
			playMouse(selectedLeftSoundId, effectiveVolume(selectedLeftSoundVolume));
		} else if (e.button === 2) {
			if (selectedRightSoundId === 'off') return;
			playMouse(selectedRightSoundId, effectiveVolume(selectedRightSoundVolume));
		}
	};

	/** Tauri: native rodio output (Web Audio is muted when the webview isn't key). */
	$effect(() => {
		if (!isTauri()) return;
		void invoke('set_sound_prefs', {
			keyboardGroups: keyboardGroupsInvokePayload(keyboardPrefs),
			mouseLeft: selectedLeftSoundId,
			mouseRight: selectedRightSoundId,
			mouseLeftVolume: selectedLeftSoundVolume,
			mouseRightVolume: selectedRightSoundVolume
		});
	});

	$effect(() => {
		if (isTauri()) return;

		document.addEventListener('mousedown', onMouseDownCapture, true);
		document.addEventListener('keydown', keyboardSoundCapture, true);

		return () => {
			document.removeEventListener('mousedown', onMouseDownCapture, true);
			document.removeEventListener('keydown', keyboardSoundCapture, true);
		};
	});
</script>

<ModeWatcher defaultMode="dark" />

<main class="flex flex-col gap-8 p-8">
	<header>
		<div class="grid grid-cols-[1fr_auto] items-center gap-4">
			<h1 class="text-3xl leading-normal font-medium tracking-tight">Mike Bell</h1>
			<DarkMode />
		</div>
		<p class="text-sm text-muted-foreground">
			Tired of paid fancy sounds? Mike Bell is here to help.
		</p>
		<div class="mt-3 flex items-center gap-3">
			<Button
				variant="ghost"
				size="icon"
				class="h-8 w-8 shrink-0"
				onclick={toggleMute}
				title={isMuted ? 'Unmute' : 'Mute'}
			>
				{#if isMuted}
					<IconSpeakerSimpleSlash class="h-4 w-4" />
				{:else}
					<IconSpeakerSimpleHigh class="h-4 w-4" />
				{/if}
			</Button>
			<Slider
				type="single"
				bind:value={masterVolume}
				max={100}
				disabled={isMuted}
				class="w-full max-w-48"
			/>
			<span class="w-8 text-right text-xs text-muted-foreground tabular-nums">
				{isMuted ? '0' : masterVolume}%
			</span>
		</div>
	</header>

	<section class="flex flex-col gap-4 rounded-lg bg-secondary p-6">
		<Popover.Root>
			<Popover.Trigger
				class={buttonVariants({
					variant: 'outline',
					class:
						'flex items-center justify-between text-xs font-medium tracking-wider text-muted-foreground'
				})}
			>
				Keyboard Configuration
				<IconSlidersHorizontal />
			</Popover.Trigger>
			<Popover.Content class="p-0">
				<ScrollArea class="h-[340px] p-2.5 pr-4">
					<div class="flex flex-col gap-2">
						<p class="px-0.5 pb-1 text-[0.65rem] leading-snug text-muted-foreground">
							Each physical key group can use its own profile—defaults are a mixed "real board"
							blend.
						</p>
						{#each KEYBOARD_GROUP_ORDER as gid (gid)}
							<SoundPicker
								title={KEYBOARD_GROUP_LABELS[gid]}
								{soundList}
								bind:selectedId={keyboardPrefs[gid].sound}
								bind:volumeValue={keyboardPrefs[gid].volume}
							/>
						{/each}
					</div>
				</ScrollArea>
			</Popover.Content>
		</Popover.Root>

		<Popover.Root>
			<Popover.Trigger
				class={buttonVariants({
					variant: 'outline',
					class:
						'flex items-center justify-between text-xs font-medium tracking-wider text-muted-foreground'
				})}
			>
				Mouse Configuration
				<IconSlidersHorizontal />
			</Popover.Trigger>
			<Popover.Content>
				<SoundPicker
					title="LEFT CLICK"
					{soundList}
					bind:selectedId={selectedLeftSoundId}
					bind:volumeValue={selectedLeftSoundVolume}
				/>

				<SoundPicker
					title="RIGHT CLICK"
					{soundList}
					bind:selectedId={selectedRightSoundId}
					bind:volumeValue={selectedRightSoundVolume}
				/>
			</Popover.Content>
		</Popover.Root>
	</section>

	<section class="flex flex-col gap-4 rounded-lg bg-secondary p-6">
		<div class="flex flex-col gap-2">
			<p class="text-xs font-medium tracking-wider text-muted-foreground">TEST TYPING AREA</p>
			<Textarea class="bg-white" placeholder="Click here and type…" />
		</div>
	</section>

	<section>
		<LetsConnect />
	</section>

	<section class="flex items-center justify-between rounded-lg bg-secondary p-4">
		<div class="flex items-center gap-2">
			<IconPower class="h-4 w-4 text-muted-foreground" />
			<p class="text-xs font-medium tracking-wider text-muted-foreground">Auto-start on login</p>
		</div>
		<Button
			variant={autoStartEnabled ? 'default' : 'outline'}
			size="sm"
			class="text-xs"
			onclick={toggleAutoStart}
		>
			{autoStartEnabled ? 'Enabled' : 'Disabled'}
		</Button>
	</section>

	<footer class="flex justify-end">
		<p class="text-xs text-muted-foreground">Version 0.1.2 Beta</p>
	</footer>
</main>
