// ===================================================================
// SPEECH — reading a question aloud with the browser's own voice.
//
// Web Speech API only: no key, no request, no dependency. Everything here
// touches `window`, so it is client-only by nature — every export is safe to
// call during SSR but reports "unsupported" there.
//
// ONE utterance at a time, process-wide: starting a new one cancels whatever
// was speaking. Which question is currently speaking is kept here and
// published through a tiny store, so every button on the page agrees about it
// (including the hidden copy of a section rendered in the other language).
//
// Built to grow: a later per-word pronunciation list only has to pre-process
// the string handed to speak().
// ===================================================================

export type SpeechLang = "en" | "de";

/** What the utterance announces itself as. */
const BCP47: Record<SpeechLang, string> = { en: "en-US", de: "de-DE" };

/** Exact locales to prefer, in order, before falling back to the prefix. */
const PREFERRED: Record<SpeechLang, string[]> = {
    en: ["en-US", "en-GB"],
    de: ["de-DE"],
};

/** Slightly under natural pace: easier to repeat after. */
const RATE = 0.95;

export function isSpeechSupported(): boolean {
    return (
        typeof window !== "undefined" &&
        "speechSynthesis" in window &&
        typeof window.SpeechSynthesisUtterance === "function"
    );
}

// -------------------------------------------------------------------
// voices
// -------------------------------------------------------------------
//
// getVoices() is empty on the first call in most browsers and fills in
// asynchronously, announced by `voiceschanged`. So the result is cached only
// once there is actually a list to choose from, and `voicesLoaded()` lets the
// UI tell "no voice for German" apart from "not known yet".

const voiceCache = new Map<SpeechLang, SpeechSynthesisVoice | null>();
const voiceListeners = new Set<() => void>();
let listening = false;

function voices(): SpeechSynthesisVoice[] {
    if (!isSpeechSupported()) return [];
    return window.speechSynthesis.getVoices();
}

export function voicesLoaded(): boolean {
    return voices().length > 0;
}

/** Fires whenever the installed voice list changes. Returns an unsubscribe. */
export function subscribeVoices(onChange: () => void): () => void {
    voiceListeners.add(onChange);
    if (isSpeechSupported() && !listening) {
        listening = true;
        window.speechSynthesis.addEventListener("voiceschanged", () => {
            // A new list invalidates every pick.
            voiceCache.clear();
            for (const listener of voiceListeners) listener();
        });
    }
    return () => voiceListeners.delete(onChange);
}

/**
 * The best installed voice for a language, or null when there is none.
 *
 * Exact locale first ("de-DE"), then any voice whose lang starts with the
 * two-letter code ("de-AT" counts), and within each step a local voice wins:
 * local ones start instantly and work offline, remote ones lag.
 */
export function getVoice(lang: SpeechLang): SpeechSynthesisVoice | null {
    const cached = voiceCache.get(lang);
    if (cached !== undefined) return cached;

    const list = voices();
    // Nothing to choose from yet — do NOT cache, the list is still coming.
    if (!list.length) return null;

    const byLocal = (a: SpeechSynthesisVoice, b: SpeechSynthesisVoice) =>
        Number(b.localService) - Number(a.localService);

    let pick: SpeechSynthesisVoice | undefined;
    for (const locale of PREFERRED[lang]) {
        pick = list
            .filter((v) => v.lang.replace("_", "-") === locale)
            .sort(byLocal)[0];
        if (pick) break;
    }
    pick ??= list
        .filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith(lang))
        .sort(byLocal)[0];

    const chosen = pick ?? null;
    voiceCache.set(lang, chosen);
    return chosen;
}

/** Every installed voice, for diagnostics. */
export function listVoices(): { name: string; lang: string; local: boolean }[] {
    return voices().map((v) => ({
        name: v.name,
        lang: v.lang,
        local: v.localService,
    }));
}

// -------------------------------------------------------------------
// speaking
// -------------------------------------------------------------------

/** The key of the question speaking right now, or null. */
let activeKey: string | null = null;
/** Guards against a cancelled utterance's late `end` clearing a newer one. */
let token = 0;
const speakingListeners = new Set<() => void>();

function publish() {
    for (const listener of speakingListeners) listener();
}

/** Subscribe to "which question is speaking". Returns an unsubscribe. */
export function subscribeSpeaking(onChange: () => void): () => void {
    speakingListeners.add(onChange);
    return () => speakingListeners.delete(onChange);
}

export function getSpeakingKey(): string | null {
    return activeKey;
}

/** Server snapshot for useSyncExternalStore: nothing speaks on the server. */
export function getSpeakingKeyServer(): null {
    return null;
}

export function stop(): void {
    if (!isSpeechSupported()) return;
    token++;
    window.speechSynthesis.cancel();
    if (activeKey !== null) {
        activeKey = null;
        publish();
    }
}

/**
 * Speaks `text` in `lang`, cancelling anything already speaking.
 *
 * `key` identifies the question, so the button that owns it can show a stop
 * state while every other button stays idle.
 */
export function speak(key: string, text: string, lang: SpeechLang): void {
    if (!isSpeechSupported()) return;

    const spoken = text.trim();
    if (!spoken) return;

    // Cancel first: only one utterance at a time, page-wide.
    token++;
    const mine = token;
    window.speechSynthesis.cancel();

    // Via `window`, the same object isSpeechSupported() checked — the bare
    // global would be a second way to reach it and only works in a browser.
    const utterance = new window.SpeechSynthesisUtterance(spoken);
    utterance.lang = BCP47[lang];
    const voice = getVoice(lang);
    if (voice) utterance.voice = voice;
    utterance.rate = RATE;

    const finish = () => {
        // A stale handler from a cancelled utterance must not clear the new one.
        if (mine !== token) return;
        activeKey = null;
        publish();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    // Optimistic: `onstart` can lag behind the click, and the button should
    // show its stop state immediately.
    activeKey = key;
    publish();
    window.speechSynthesis.speak(utterance);
}
