<script lang="ts">
  import * as DropdownMenu from "$lib/components/internals/dropdown-menu/index";
  import { Slider } from "$lib/components/internals/slider/index";
  import { Input } from "$lib/components/internals/input/index";
  import IconFileVolume from "phosphor-svelte/lib/WaveSineIcon";
  import { buttonVariants } from "$lib/components/internals/button/index.js";

  interface Props {
    value: number;
  }

  let { value = $bindable() }: Props = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger
    class={buttonVariants({ variant: "outline", size: "icon" })}
  >
    <IconFileVolume />
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end" class="w-38 h-fit p-4 flex flex-col gap-4">
    <p class="text-xs font-medium tracking-wider text-muted-foreground">
      ADJUST VOLUME
    </p>
    <Input type="number" bind:value max={100} class="w-full" />
    <Slider type="single" bind:value max={100} class="w-full" />
  </DropdownMenu.Content>
</DropdownMenu.Root>
