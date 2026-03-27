<script lang="ts">
  import "./layout.css";
  import { invoke, isTauri } from "@tauri-apps/api/core";
  import { playKeyboard, playMouse } from "$lib/sound-engines";
  import { Textarea } from "$lib/components/internals/textarea/index";
  import DarkMode from "$lib/components/externals/dark-mode/dark-mode.svelte";
  import { ModeWatcher } from "mode-watcher";
  import type { SoundIds } from "$lib/types";
  import {
    DEFAULT_KEYBOARD_GROUP_PREFS,
    KEYBOARD_GROUP_LABELS,
    KEYBOARD_GROUP_ORDER,
    keyboardGroupFromCode,
    keyboardGroupsInvokePayload,
    type KeyboardGroupId,
  } from "$lib/keyboard-groups";
  import LetsConnect from "$lib/components/externals/lets-connect/lets-connect.svelte";
  import SoundPicker from "./(components)/(sound-picker)/sound-picker.svelte";
  import * as Popover from "$lib/components/internals/popover/index";
  import { buttonVariants } from "$lib/components/internals/button";
  import IconSlidersHorizontal from "phosphor-svelte/lib/SlidersHorizontalIcon";
  import { ScrollArea } from "$lib/components/internals/scroll-area/index";

  let soundList: { id: SoundIds; name: string }[] = [
    { id: "off", name: "Off" },
    { id: "classic", name: "Classic" },
    { id: "soft", name: "Soft" },
    { id: "bubble", name: "Bubble" },
    { id: "vault", name: "Vault" },
    { id: "dew", name: "Dew" },
    { id: "ink", name: "Ink" },
    { id: "spark", name: "Spark" },
    { id: "velvet", name: "Velvet" },
    { id: "wool", name: "Wool" },
    { id: "cocoa", name: "Cocoa" },
    { id: "plush", name: "Plush" },
    { id: "thock", name: "Thock" },
    { id: "cream", name: "Cream" },
    { id: "flannel", name: "Flannel" },
    { id: "ember", name: "Ember" },
    { id: "honey", name: "Honey" },
    { id: "cashmere", name: "Cashmere" },
    { id: "moss", name: "Moss" },
  ];

  let selectedLeftSoundId = $state<SoundIds>("off");
  let selectedLeftSoundVolume = $state(80);
  let selectedRightSoundId = $state<SoundIds>("off");
  let selectedRightSoundVolume = $state(80);

  let keyboardPrefs = $state<
    Record<KeyboardGroupId, { sound: SoundIds; volume: number }>
  >(structuredClone(DEFAULT_KEYBOARD_GROUP_PREFS));

  const keyboardSoundCapture = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const group = keyboardGroupFromCode(e.code);
    const pref = keyboardPrefs[group];
    if (pref.sound === "off") return;

    const isModifierPhysicalKey =
      e.code.startsWith("Control") ||
      e.code.startsWith("Alt") ||
      e.code.startsWith("Meta") ||
      e.code.startsWith("Shift") ||
      e.code === "CapsLock" ||
      e.code === "Fn";

    if (!isModifierPhysicalKey && (e.metaKey || e.ctrlKey || e.altKey)) return;

    playKeyboard(pref.sound, pref.volume);
  };

  const onMouseDownCapture = (e: MouseEvent) => {
    if (e.button === 0) {
      if (selectedLeftSoundId === "off") return;
      playMouse(selectedLeftSoundId, selectedLeftSoundVolume);
    } else if (e.button === 2) {
      if (selectedRightSoundId === "off") return;
      playMouse(selectedRightSoundId, selectedRightSoundVolume);
    }
  };

  /** Tauri: native rodio output (Web Audio is muted when the webview isn’t key). */
  $effect(() => {
    if (!isTauri()) return;
    void invoke("set_sound_prefs", {
      keyboardGroups: keyboardGroupsInvokePayload(keyboardPrefs),
      mouseLeft: selectedLeftSoundId,
      mouseRight: selectedRightSoundId,
      mouseLeftVolume: selectedLeftSoundVolume,
      mouseRightVolume: selectedRightSoundVolume,
    });
  });

  $effect(() => {
    if (isTauri()) return;

    document.addEventListener("mousedown", onMouseDownCapture, true);
    document.addEventListener("keydown", keyboardSoundCapture, true);

    return () => {
      document.removeEventListener("mousedown", onMouseDownCapture, true);
      document.removeEventListener("keydown", keyboardSoundCapture, true);
    };
  });
</script>

<ModeWatcher defaultMode="dark" />

<main class="p-8 flex flex-col gap-8">
  <header>
    <div class="grid grid-cols-[1fr_auto] gap-4 items-center">
      <h1 class="text-3xl font-medium leading-normal tracking-tight">
        Mike Bell
      </h1>
      <DarkMode />
    </div>
    <p class="text-sm text-muted-foreground">
      Tired of paid fancy sounds? Mike Bell is here to help.
    </p>
  </header>

  <section class="flex flex-col gap-4 rounded-lg p-6 bg-secondary">
    <Popover.Root>
      <Popover.Trigger
        class={buttonVariants({
          variant: "outline",
          class:
            "text-xs font-medium tracking-wider text-muted-foreground flex justify-between items-center",
        })}
      >
        Keyboard Configuration
        <IconSlidersHorizontal />
      </Popover.Trigger>
      <Popover.Content class="p-0">
        <ScrollArea class="h-[340px] pr-4 p-2.5">
          <div class="flex flex-col gap-2">
            <p
              class="text-[0.65rem] leading-snug text-muted-foreground px-0.5 pb-1"
            >
              Each physical key group can use its own profile—defaults are a
              mixed “real board” blend.
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
          variant: "outline",
          class:
            "text-xs font-medium tracking-wider text-muted-foreground flex justify-between items-center",
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

  <section class="flex flex-col gap-4 rounded-lg p-6 bg-secondary">
    <div class="flex flex-col gap-2">
      <p class="text-xs font-medium tracking-wider text-muted-foreground">
        TEST TYPING AREA
      </p>
      <Textarea class="bg-white" placeholder="Click here and type…" />
    </div>
  </section>

  <section>
    <LetsConnect />
  </section>

  <footer class="flex justify-end">
    <p class="text-xs text-muted-foreground">Version 0.1.2 Beta</p>
  </footer>
</main>
