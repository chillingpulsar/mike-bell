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
	import LetsConnect from '$lib/components/externals/lets-connect/lets-connect.svelte';
	import SoundPicker from './(components)/(sound-picker)/sound-picker.svelte';
	import * as Popover from '$lib/components/internals/popover/index';
	import { buttonVariants, Button } from '$lib/components/internals/button';
	import IconSlidersHorizontal from 'phosphor-svelte/lib/SlidersHorizontalIcon';
	import IconUpload from 'phosphor-svelte/lib/UploadIcon';
	import IconTrash from 'phosphor-svelte/lib/TrashIcon';
	import { ScrollArea } from '$lib/components/internals/scroll-area/index';
	import { onMount } from 'svelte';

	let builtinSoundList: { id: SoundIds; name: string }[] = [
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

	// Custom sounds
	let customSoundFiles = $state<string[]>([]);
	let uploadError = $state('');
	let fileInput: HTMLInputElement | undefined = $state();

	const soundList = $derived<{ id: SoundIds; name: string }[]>([
		...builtinSoundList,
		...customSoundFiles.map((f) => ({
			id: `custom:${f}` as SoundIds,
			name: `Custom: ${f.replace(/\.[^/.]+$/, '')}`
		}))
	]);

	onMount(async () => {
		if (!isTauri()) return;
		try {
			const files: string[] = await invoke('list_custom_sounds');
			customSoundFiles = files;
		} catch {
			// ignore
		}
	});

	async function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		uploadError = '';

		try {
			const arrayBuffer = await file.arrayBuffer();
			const data = Array.from(new Uint8Array(arrayBuffer));
			await invoke('upload_custom_sound', { name: file.name, data });
			const files: string[] = await invoke('list_custom_sounds');
			customSoundFiles = files;
		} catch (err) {
			uploadError = String(err);
		}

		// Reset file input
		if (fileInput) fileInput.value = '';
	}

	async function handleDeleteCustom(filename: string) {
		try {
			await invoke('delete_custom_sound', { filename });
			const files: string[] = await invoke('list_custom_sounds');
			customSoundFiles = files;
		} catch {
			// ignore
		}
	}

	let selectedLeftSoundId = $state<SoundIds>(DEFAULT_MOUSE_PREFS.left.sound);
	let selectedLeftSoundVolume = $state(DEFAULT_MOUSE_PREFS.left.volume);
	let selectedRightSoundId = $state<SoundIds>(DEFAULT_MOUSE_PREFS.right.sound);
	let selectedRightSoundVolume = $state(DEFAULT_MOUSE_PREFS.right.volume);

	let keyboardPrefs = $state<Record<KeyboardGroupId, { sound: SoundIds; volume: number }>>(
		structuredClone(DEFAULT_KEYBOARD_GROUP_PREFS)
	);

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

		playKeyboard(pref.sound, pref.volume);
	};

	const onMouseDownCapture = (e: MouseEvent) => {
		if (e.button === 0) {
			if (selectedLeftSoundId === 'off') return;
			playMouse(selectedLeftSoundId, selectedLeftSoundVolume);
		} else if (e.button === 2) {
			if (selectedRightSoundId === 'off') return;
			playMouse(selectedRightSoundId, selectedRightSoundVolume);
		}
	};

	/** Tauri: native rodio output (Web Audio is muted when the webview isn’t key). */
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
							Each physical key group can use its own profile—defaults are a mixed “real board”
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

	{#if isTauri()}
		<section class="flex flex-col gap-3 rounded-lg bg-secondary p-6">
			<p class="text-xs font-medium tracking-wider text-muted-foreground">CUSTOM SOUNDS</p>
			<p class="text-[0.65rem] leading-snug text-muted-foreground">
				Upload WAV, MP3, or OGG files (max 5MB). Custom sounds appear in the picker.
			</p>
			<div class="flex items-center gap-2">
				<input
					type="file"
					accept=".wav,.mp3,.ogg"
					class="hidden"
					bind:this={fileInput}
					onchange={handleFileUpload}
				/>
				<Button variant="outline" size="sm" class="text-xs" onclick={() => fileInput?.click()}>
					<IconUpload class="mr-1 h-3.5 w-3.5" />
					Upload Sound
				</Button>
			</div>
			{#if uploadError}
				<p class="text-xs text-destructive">{uploadError}</p>
			{/if}
			{#if customSoundFiles.length > 0}
				<div class="flex flex-col gap-1">
					{#each customSoundFiles as file (file)}
						<div class="flex items-center justify-between rounded bg-background px-3 py-1.5">
							<span class="truncate text-xs text-foreground">{file}</span>
							<Button
								variant="ghost"
								size="icon"
								class="h-6 w-6 shrink-0"
								onclick={() => handleDeleteCustom(file)}
								title="Delete custom sound"
							>
								<IconTrash class="h-3 w-3" />
							</Button>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}

	<section>
		<LetsConnect />
	</section>

	<footer class="flex justify-end">
		<p class="text-xs text-muted-foreground">Version 0.1.2 Beta</p>
	</footer>
</main>
