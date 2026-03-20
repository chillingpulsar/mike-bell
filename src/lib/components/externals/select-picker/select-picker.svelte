<script lang="ts" generics="T extends { id: string, name: string }">
  import * as Select from "$lib/components/internals/select/index";
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";
  import type { ClassNameValue } from "tailwind-merge";

  interface Props {
    selections: T[];
    selection?: Snippet<[{ selected: T }]>;
    staticSelection?: Snippet;
    selectedId: string;
    placeholder?: string;
    onChange?: (v: T | undefined) => void;
    class?: ClassNameValue;
  }

  let {
    selections,
    selection,
    staticSelection,
    onChange,
    placeholder = "Select an option",
    selectedId = $bindable(),
    class: className,
  }: Props = $props();

  const selectedItem = $derived(
    selections.find((item) => item.id === selectedId),
  );
</script>

<!--@component
@param {T[]} selections
@param selection is a Snippet that renders a selection item do not forget to import Select.Item - mikey
@param placeholder is the placeholder of the select picker
@bindable selectedId: string this is the primary key of the selected item
@returns onChange: (v: T) => void so you have a copy of the selected item
-->

<Select.Root
  type="single"
  allowDeselect
  bind:value={selectedId}
  onValueChange={() => {
    onChange?.(selectedItem);
  }}
>
  <Select.Trigger class={cn("w-full bg-white", className)}>
    <span class="line-clamp-1 truncate"
      >{selectedItem?.name ?? placeholder}</span
    >
  </Select.Trigger>
  <Select.Content class="max-h-[200px]">
    {#if staticSelection}
      {@render staticSelection()}
    {/if}

    {#if selection}
      {#each selections as selectionItem}
        {@render selection({ selected: selectionItem })}
      {/each}
    {:else}
      {#each selections as selectionItem}
        <Select.Item value={selectionItem.id}>{selectionItem.name}</Select.Item>
      {/each}
    {/if}
  </Select.Content>
</Select.Root>
