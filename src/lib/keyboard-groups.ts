/**
 * Physical-key groupings for keyboard feedback. Uses `KeyboardEvent.code` (layout-stable)
 * so QWERTY vs AZERTY still maps to the same keycap “kind”.
 */

import type { SoundIds } from "$lib/types";

export type KeyboardGroupId =
  | "letters"
  | "numbers"
  | "functionKeys"
  | "modifiers"
  | "spaceEnter"
  | "tabEscape"
  | "navigation"
  | "punctuation";

export const KEYBOARD_GROUP_ORDER: KeyboardGroupId[] = [
  "letters",
  "numbers",
  "functionKeys",
  "modifiers",
  "spaceEnter",
  "tabEscape",
  "navigation",
  "punctuation",
];

export const KEYBOARD_GROUP_LABELS: Record<KeyboardGroupId, string> = {
  letters: "Letters (A–Z)",
  numbers: "Numbers (0–9 & numpad)",
  functionKeys: "Function keys (F1–F12)",
  modifiers: "Modifiers (Ctrl, Alt, ⌘, Shift)",
  spaceEnter: "Space & Enter",
  tabEscape: "Tab & Escape",
  navigation: "Navigation (arrows, Home, Backspace, …)",
  punctuation: "Punctuation & symbols",
};

/** One sound + volume per group (defaults are a mixed “board” feel). */
export const DEFAULT_KEYBOARD_GROUP_PREFS: Record<
  KeyboardGroupId,
  { sound: SoundIds; volume: number }
> = {
  letters: { sound: "thock", volume: 82 },
  numbers: { sound: "dew", volume: 78 },
  functionKeys: { sound: "vault", volume: 76 },
  modifiers: { sound: "plush", volume: 72 },
  spaceEnter: { sound: "cream", volume: 84 },
  tabEscape: { sound: "ink", volume: 74 },
  navigation: { sound: "velvet", volume: 78 },
  punctuation: { sound: "bubble", volume: 76 },
};

/**
 * Map a physical key to a sound group. Prefer `event.code`; `key` is only for edge cases.
 */
export function keyboardGroupFromCode(code: string): KeyboardGroupId {
  // Modifiers (physical keys)
  if (
    code === "ControlLeft" ||
    code === "ControlRight" ||
    code === "AltLeft" ||
    code === "AltRight" ||
    code === "MetaLeft" ||
    code === "MetaRight" ||
    code === "ShiftLeft" ||
    code === "ShiftRight" ||
    code === "CapsLock" ||
    code === "Fn" ||
    code === "OSLeft" ||
    code === "OSRight"
  ) {
    return "modifiers";
  }

  if (code === "Space") return "spaceEnter";
  if (code === "Enter" || code === "NumpadEnter") return "spaceEnter";

  if (code === "Tab") return "tabEscape";
  if (code === "Escape") return "tabEscape";

  if (/^F\d+$/.test(code)) return "functionKeys";

  if (code.startsWith("Numpad")) {
    if (code === "NumpadEnter") return "spaceEnter";
    if (
      /^Numpad[0-9]$/.test(code) ||
      code === "NumpadDecimal" ||
      code === "NumpadComma"
    ) {
      return "numbers";
    }
    return "punctuation";
  }

  if (code.startsWith("Digit")) return "numbers";

  if (
    code === "ArrowLeft" ||
    code === "ArrowRight" ||
    code === "ArrowUp" ||
    code === "ArrowDown" ||
    code === "Home" ||
    code === "End" ||
    code === "PageUp" ||
    code === "PageDown" ||
    code === "Insert" ||
    code === "Delete" ||
    code === "Backspace"
  ) {
    return "navigation";
  }

  if (code.startsWith("Key")) return "letters";

  return "punctuation";
}

export function keyboardPrefsAllOff(): Record<
  KeyboardGroupId,
  { sound: SoundIds; volume: number }
> {
  const o = {} as Record<KeyboardGroupId, { sound: SoundIds; volume: number }>;
  for (const id of KEYBOARD_GROUP_ORDER) {
    o[id] = { sound: "off", volume: 80 };
  }
  return o;
}

/** Payload shape for `set_sound_prefs` / native audio (camelCase keys). */
export function keyboardGroupsInvokePayload(
  prefs: Record<KeyboardGroupId, { sound: SoundIds; volume: number }>,
) {
  return {
    letters: {
      sound: prefs.letters.sound,
      volume: prefs.letters.volume,
    },
    numbers: {
      sound: prefs.numbers.sound,
      volume: prefs.numbers.volume,
    },
    functionKeys: {
      sound: prefs.functionKeys.sound,
      volume: prefs.functionKeys.volume,
    },
    modifiers: {
      sound: prefs.modifiers.sound,
      volume: prefs.modifiers.volume,
    },
    spaceEnter: {
      sound: prefs.spaceEnter.sound,
      volume: prefs.spaceEnter.volume,
    },
    tabEscape: {
      sound: prefs.tabEscape.sound,
      volume: prefs.tabEscape.volume,
    },
    navigation: {
      sound: prefs.navigation.sound,
      volume: prefs.navigation.volume,
    },
    punctuation: {
      sound: prefs.punctuation.sound,
      volume: prefs.punctuation.volume,
    },
  };
}
