// Tracks currently pressed keys for the on-screen keyboard.
// Smooths key release so highlights are visible while typing.
import { useEffect, useRef, useState } from "react";

const EMPTY_ACTIVE_KEYS = new Set<string>();

function normalizePressedKey(key: string): string | null {
  if (key.length === 1) return key.toLowerCase();

  if (key === " ") return "space";
  if (key === "Escape") return "esc";
  if (key === "Backspace") return "backspace";
  if (key === "Tab") return "tab";
  if (key === "CapsLock") return "capslock";
  if (key === "Enter") return "enter";
  if (key === "Shift") return "shift";
  if (key === "Control") return "ctrl";
  if (key === "Meta") return "meta";
  if (key === "Alt") return "alt";
  if (key === "AltGraph") return "altgr";
  if (key === "ContextMenu") return "menu";

  return null;
}

export function useActiveKeyboardKeys(enabled: boolean): Set<string> {
  const [activeKeyboardKeys, setActiveKeyboardKeys] = useState<Set<string>>(new Set());
  const keyReleaseTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function clearReleaseTimer(keyId: string) {
      const timerId = keyReleaseTimersRef.current[keyId];
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
        delete keyReleaseTimersRef.current[keyId];
      }
    }

    function clearAllKeys() {
      setActiveKeyboardKeys(new Set());
      Object.values(keyReleaseTimersRef.current).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      keyReleaseTimersRef.current = {};
    }

    function handleWindowKeyDown(event: KeyboardEvent) {
      const keyId = normalizePressedKey(event.key);
      if (!keyId) return;

      clearReleaseTimer(keyId);
      setActiveKeyboardKeys((previous) => {
        const next = new Set(previous);
        next.add(keyId);
        return next;
      });
    }

    function handleWindowKeyUp(event: KeyboardEvent) {
      const keyId = normalizePressedKey(event.key);
      if (!keyId) return;

      clearReleaseTimer(keyId);
      keyReleaseTimersRef.current[keyId] = window.setTimeout(() => {
        setActiveKeyboardKeys((previous) => {
          if (!previous.has(keyId)) return previous;
          const next = new Set(previous);
          next.delete(keyId);
          return next;
        });
        delete keyReleaseTimersRef.current[keyId];
      }, 120);
    }

    window.addEventListener("keydown", handleWindowKeyDown);
    window.addEventListener("keyup", handleWindowKeyUp);
    window.addEventListener("blur", clearAllKeys);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
      window.removeEventListener("keyup", handleWindowKeyUp);
      window.removeEventListener("blur", clearAllKeys);
      clearAllKeys();
    };
  }, [enabled]);

  return enabled ? activeKeyboardKeys : EMPTY_ACTIVE_KEYS;
}
