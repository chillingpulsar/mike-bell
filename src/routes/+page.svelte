<script lang="ts">
  import "./layout.css";
  import { invoke, isTauri } from "@tauri-apps/api/core";
  import { playKeyboard, playMouse } from "$lib/sound-engines";
  import SelectPicker from "$lib/components/externals/select-picker/select-picker.svelte";
  import { Textarea } from "$lib/components/internals/textarea/index";
  import DarkMode from "$lib/components/externals/dark-mode/dark-mode.svelte";
  import { ModeWatcher } from "mode-watcher";
  import type { SoundIds } from "$lib/types";
  import LetsConnect from "$lib/components/externals/lets-connect/lets-connect.svelte";

  /** Latest picks for Tauri global hooks (listener registered once). */
  const soundPrefs = { keyboard: "off" as SoundIds, mouse: "off" as SoundIds };

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

  $effect(() => {
    soundPrefs.keyboard = selectedKeyboardSoundId;
    soundPrefs.mouse = selectedMouseSoundId;
  });

  const keyboardSoundCapture = (e: KeyboardEvent) => {
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

  function requestSystemInputPermission() {
    void invoke("prompt_global_input_access");
  }

  $effect(() => {
    if (isTauri()) {
      let active = true;
      const unlistenFns: Array<() => void> = [];

      void (async () => {
        const { listen } = await import("@tauri-apps/api/event");
        if (!active) return;

        const uk = await listen("mikebell-keyboard", () => {
          if (soundPrefs.keyboard === "off") return;
          playKeyboard(soundPrefs.keyboard);
        });
        if (!active) {
          uk();
          return;
        }
        unlistenFns.push(uk);

        const um = await listen("mikebell-mouse", () => {
          if (soundPrefs.mouse === "off") return;
          playMouse(soundPrefs.mouse);
        });
        if (!active) {
          um();
          return;
        }
        unlistenFns.push(um);
      })();

      return () => {
        active = false;
        for (const u of unlistenFns) u();
      };
    }

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
