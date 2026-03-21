<script lang="ts">
  import SelectPicker from "$lib/components/externals/select-picker/select-picker.svelte";
  import Volume from "$lib/components/externals/volume/volume.svelte";
  import type { SoundIds } from "$lib/types";

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
    volumeValue = $bindable(),
  }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  <p class="text-xs font-medium tracking-wider text-muted-foreground">
    {title}
  </p>
  <div class="grid grid-cols-[1fr_auto] gap-2">
    <SelectPicker bind:selectedId selections={soundList} />
    <Volume bind:value={volumeValue} />
  </div>
</div>
