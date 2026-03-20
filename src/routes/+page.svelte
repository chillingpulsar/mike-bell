<script lang="ts">
  import "./layout.css";
  import { playKeyboard, playMouse } from "$lib/sound-engines";
  import SelectPicker from "$lib/components/externals/select-picker/select-picker.svelte";
  import { Textarea } from "$lib/components/internals/textarea/index";
  import DarkMode from "$lib/components/externals/dark-mode/dark-mode.svelte";
  import { ModeWatcher } from "mode-watcher";
  import type { SoundIds } from "$lib/types";
  import LetsConnect from "$lib/components/externals/lets-connect/lets-connect.svelte";

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
  ];
  let selectedMouseSoundId = $state<SoundIds>("off");
  let selectedKeyboardSoundId = $state<SoundIds>("off");

  const keyboardSoungCapture = (e: KeyboardEvent) => {
    if (selectedKeyboardSoundId === "off") return;
    if (e.repeat) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Tab" || e.key === "Escape") return;
    playKeyboard(selectedKeyboardSoundId);
  };

  const onMouseDownCapture = (e: MouseEvent) => {
    if (selectedMouseSoundId === "off") return;
    if (e.button !== 0) return;
    playMouse(selectedMouseSoundId);
  };

  $effect(() => {
    document.addEventListener("mousedown", onMouseDownCapture, true);
    document.addEventListener("keydown", keyboardSoungCapture, true);

    return () => {
      document.removeEventListener("mousedown", onMouseDownCapture, true);
      document.removeEventListener("keydown", keyboardSoungCapture, true);
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
    <div class="flex flex-col gap-2">
      <p class="text-xs font-medium tracking-wider text-muted-foreground">
        KEYBOARD SOUNDS
      </p>
      <SelectPicker
        bind:selectedId={selectedKeyboardSoundId}
        selections={soundList}
      />
    </div>

    <div class="flex flex-col gap-2">
      <p class="text-xs font-medium tracking-wider text-muted-foreground">
        MOUSE SOUNDS
      </p>
      <SelectPicker
        bind:selectedId={selectedMouseSoundId}
        selections={soundList}
      />
    </div>
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
    <p class="text-xs text-muted-foreground">Version 0.1.0 Beta</p>
  </footer>
</main>
