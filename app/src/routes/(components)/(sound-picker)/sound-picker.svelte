<script lang="ts">
	import SelectPicker from '$lib/components/externals/select-picker/select-picker.svelte';
	import Volume from '$lib/components/externals/volume/volume.svelte';
	import { Button } from '$lib/components/internals/button/index';
	import { playKeyboard } from '$lib/sound-engines';
	import type { SoundIds } from '$lib/types';
	import IconPlay from 'phosphor-svelte/lib/PlayIcon';

	interface Props {
		title: string;
		soundList: { id: SoundIds; name: string }[];
		selectedId: SoundIds;
		onChange?: (id: SoundIds) => void;
		volumeValue: number;
	}

	let {
		title,
		soundList,
		onChange,
		selectedId = $bindable(),
		volumeValue = $bindable()
	}: Props = $props();

	function handlePreview() {
		if (selectedId === 'off') return;
		playKeyboard(selectedId, volumeValue);
	}
</script>

<div class="flex flex-col gap-2">
	<p class="text-xs font-medium tracking-wider text-muted-foreground">
		{title}
	</p>
	<div class="grid grid-cols-[1fr_auto] gap-2">
		<SelectPicker bind:selectedId selections={soundList} />
		<div class="flex items-center gap-1">
			<Button
				variant="outline"
				size="icon"
				class="h-8 w-8 shrink-0"
				onclick={handlePreview}
				disabled={selectedId === 'off'}
				title="Preview sound"
			>
				<IconPlay class="h-3.5 w-3.5" />
			</Button>
			<Volume bind:value={volumeValue} />
		</div>
	</div>
</div>
