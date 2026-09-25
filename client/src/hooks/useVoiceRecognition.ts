"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecEvent) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getWebCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

function isLikelyEmulator(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /sdk_gphone|Emulator|Android SDK built for|goldfish|ranchu/i.test(ua);
}

/**
 * Push-to-talk Arabic speech recognition.
 * - Native (Capacitor Android/iOS): device speech APIs + mic permission
 * - Web (Chrome): Web Speech API (needs internet)
 */
export function useVoiceRecognition() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<"native" | "web" | "none">("none");

  const recRef = useRef<SpeechRec | null>(null);
  const finalRef = useRef("");
  const sessionBaseRef = useRef("");
  const wantRef = useRef(false);
  const nativePartialHandle = useRef<{ remove: () => Promise<void> } | null>(
    null,
  );
  const nativeStateHandle = useRef<{ remove: () => Promise<void> } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      if (isNativeApp()) {
        try {
          const { available } = await SpeechRecognition.available();
          if (!cancelled) {
            setSupported(available);
            setRuntime(available ? "native" : "none");
            if (!available) {
              setTip(
                "جهازك ما بيدعم التعرف الصوتي الأصلي. اكتب الطلب في المربع.",
              );
            }
          }
        } catch {
          if (!cancelled) {
            setSupported(false);
            setRuntime("none");
          }
        }
        return;
      }

      const webOk = Boolean(getWebCtor());
      if (!cancelled) {
        setSupported(webOk);
        setRuntime(webOk ? "web" : "none");
      }
    }

    void detect();

    return () => {
      cancelled = true;
      wantRef.current = false;
      void cleanupNativeListeners();
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  async function cleanupNativeListeners() {
    try {
      await nativePartialHandle.current?.remove();
    } catch {
      /* ignore */
    }
    try {
      await nativeStateHandle.current?.remove();
    } catch {
      /* ignore */
    }
    nativePartialHandle.current = null;
    nativeStateHandle.current = null;
    try {
      await SpeechRecognition.removeAllListeners();
    } catch {
      /* ignore */
    }
  }

  const stopNative = useCallback(async () => {
    wantRef.current = false;
    setListening(false);
    setInterimText("");
    setStatus(
      finalRef.current
        ? "تم التسجيل — اضغط «حوّل لطلب» أو كمّل جملة ثانية"
        : null,
    );
    try {
      await SpeechRecognition.stop();
    } catch {
      /* ignore */
    }
    await cleanupNativeListeners();
  }, []);

  const stopWeb = useCallback(() => {
    wantRef.current = false;
    setListening(false);
    setInterimText("");
    setStatus(null);
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const stop = useCallback(() => {
    if (isNativeApp()) {
      void stopNative();
      return;
    }
    stopWeb();
  }, [stopNative, stopWeb]);

  const startNative = useCallback(async () => {
    const emulatorHint = isLikelyEmulator()
      ? " على المحاكي: من شريط الـ Emulator اضغطوا ⋮ → Microphone → فعّلوا Virtual mic وحدّدوا مايك اللابتوب. أو الصقوا الجملة يدوياً."
      : "";

    try {
      const { available } = await SpeechRecognition.available();
      if (!available) {
        setSupported(false);
        setTip(
          `التعرف الصوتي غير متاح على هذا الجهاز. اكتبوا أو الصقوا الطلب.${emulatorHint}`,
        );
        return;
      }

      const perm = await SpeechRecognition.checkPermissions();
      if (perm.speechRecognition !== "granted") {
        const req = await SpeechRecognition.requestPermissions();
        if (req.speechRecognition !== "granted") {
          setTip(
            "لازم تسمحوا بالميكروفون من إعدادات التطبيق، أو اكتبوا الطلب.",
          );
          return;
        }
      }

      if (!navigator.onLine) {
        setTip(
          "لازم إنترنت لتحويل الصوت لنص. إذا الشبكة ضعيفة: اكتبوا الطلب.",
        );
        return;
      }

      sessionBaseRef.current = finalRef.current.trim();
      setTip(
        isLikelyEmulator()
          ? "المحاكي غالباً ما يسمع مايك اللابتوب — إذا ما طلع نص: فعّلوا Microphone من ⋮ أو الصقوا الجملة."
          : null,
      );
      setStatus("عم نسمعك… احكوا جملة الطلب");
      wantRef.current = true;
      setListening(true);

      await cleanupNativeListeners();

      // Android: Google speech popup is far more reliable than silent SpeechRecognizer
      // (especially on emulators). Returns matches on the start() promise.
      const platform = Capacitor.getPlatform();
      const usePopup = platform === "android";

      if (!usePopup) {
        nativePartialHandle.current = await SpeechRecognition.addListener(
          "partialResults",
          (data: { matches?: string[] }) => {
            const text = (data.matches?.[0] ?? "").replace(/\s+/g, " ").trim();
            if (!text) return;
            setInterimText(text);
            const merged = [sessionBaseRef.current, text]
              .filter(Boolean)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            finalRef.current = merged;
            setFinalText(merged);
          },
        );

        nativeStateHandle.current = await SpeechRecognition.addListener(
          "listeningState",
          (data: { status: "started" | "stopped" }) => {
            if (data.status === "started" && wantRef.current) {
              setListening(true);
              setStatus("عم نسمعك… احكوا بوضوح");
            }
            if (data.status === "stopped") {
              setListening(false);
              setInterimText("");
              wantRef.current = false;
              setFinalText(finalRef.current);
              setStatus(
                finalRef.current
                  ? "تم التسجيل — اضغطوا «حوّل لطلب» أو كمّلوا جملة ثانية"
                  : null,
              );
            }
          },
        );
      }

      const result = await SpeechRecognition.start({
        language: "ar-SA",
        maxResults: 5,
        prompt: "احكوا طلب التوصيل بالعربي",
        partialResults: !usePopup,
        popup: usePopup,
      });

      const matches = (result as { matches?: string[] } | undefined)?.matches;
      const spoken = (matches?.[0] ?? "").replace(/\s+/g, " ").trim();
      if (spoken) {
        const merged = [sessionBaseRef.current, spoken]
          .filter(Boolean)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        finalRef.current = merged;
        setFinalText(merged);
        setStatus("تم التسجيل — اضغطوا «حوّل لطلب»");
        setTip(null);
      } else if (usePopup) {
        setTip(
          `ما التقطنا كلام واضح.${emulatorHint} تقدروا تلصقوا الجملة بالمربع.`,
        );
      }

      setListening(false);
      setInterimText("");
      wantRef.current = false;
    } catch (err) {
      const msg = String((err as { message?: string })?.message ?? err ?? "");
      const lower = msg.toLowerCase();
      if (
        lower.includes("no speech") ||
        lower.includes("no match") ||
        lower.includes("speech_timeout") ||
        lower.includes("didn")
      ) {
        setTip(
          `ما انسمع صوت / ما في تطابق.${emulatorHint} الصقوا الجملة وجربوا «حوّل لطلب».`,
        );
      } else if (lower.includes("network")) {
        setTip("مشكلة شبكة أثناء التعرف الصوتي. تأكدوا من النت أو اكتبوا الطلب.");
      } else if (lower.includes("permission")) {
        setTip("صلاحية المايك مرفوضة. فعّلوها من إعدادات التطبيق.");
      } else {
        setTip(
          `ما قدرنا نسجّل الصوت${msg ? `: ${msg}` : "."}${emulatorHint}`,
        );
      }
      wantRef.current = false;
      setListening(false);
      await cleanupNativeListeners();
    }
  }, []);

  const startWeb = useCallback(() => {
    const Ctor = getWebCtor();
    if (!Ctor) {
      setSupported(false);
      setTip(
        "المتصفح ما بيدعم التعرف الصوتي. افتح Chrome على أندرويد، أو ثبّت تطبيق الموبايل، أو اكتب الطلب.",
      );
      return;
    }

    if (!navigator.onLine) {
      setTip(
        "ما في إنترنت الآن. اكتب أو الصق جملة الطلب — التحويل من صوت لنص يحتاج نت على الويب.",
      );
      return;
    }

    try {
      recRef.current?.abort();
    } catch {
      /* ignore */
    }

    sessionBaseRef.current = finalRef.current.trim();
    setTip(null);
    setStatus("عم نسمعك… احكي جملة الطلب");
    wantRef.current = true;

    const rec = new Ctor();
    rec.lang = "ar-SA";
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    recRef.current = rec;

    rec.onstart = () => {
      if (wantRef.current) {
        setListening(true);
        setStatus("عم نسمعك… احكي بوضوح");
      }
    };

    rec.onresult = (ev) => {
      let interim = "";
      let sessionFinal = "";
      for (let i = 0; i < ev.results.length; i++) {
        const r = ev.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) sessionFinal += `${t} `;
        else interim += t;
      }
      sessionFinal = sessionFinal.replace(/\s+/g, " ").trim();
      interim = interim.replace(/\s+/g, " ").trim();

      const merged = [sessionBaseRef.current, sessionFinal]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (sessionFinal) {
        finalRef.current = merged;
        setFinalText(merged);
      }
      setInterimText(interim);
    };

    rec.onerror = (ev) => {
      if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
        setTip("اسمح بالميكروفون من قفل الموقع أعلى المتصفح، أو اكتب الطلب.");
        wantRef.current = false;
        setListening(false);
        return;
      }
      if (ev.error === "network") {
        setTip(
          "تحويل الصوت لنص يحتاج إنترنت. إذا الشبكة ضعيفة: اكتب الجملة يدوياً.",
        );
        wantRef.current = false;
        setListening(false);
        return;
      }
      if (ev.error === "no-speech") {
        setStatus("ما سمعنا شي — اضغط مرة ثانية واحكي أقرب للمايك");
        return;
      }
      if (ev.error === "aborted") return;
      if (ev.error === "audio-capture") {
        setTip("ما في مايكروفون متاح على الجهاز.");
        wantRef.current = false;
        setListening(false);
      }
    };

    rec.onend = () => {
      setInterimText("");
      setListening(false);
      wantRef.current = false;
      setFinalText(finalRef.current);
      setStatus(
        finalRef.current
          ? "تم التسجيل — اضغط «حوّل لطلب» أو كمّل جملة ثانية"
          : null,
      );
    };

    try {
      rec.start();
    } catch {
      setTip("ما قدرنا نفتح المايك. جرّب Chrome أو تطبيق الموبايل أو اكتب الطلب.");
      wantRef.current = false;
      setListening(false);
    }
  }, []);

  const start = useCallback(() => {
    if (isNativeApp()) {
      void startNative();
      return;
    }
    startWeb();
  }, [startNative, startWeb]);

  const clearTranscript = useCallback(() => {
    finalRef.current = "";
    sessionBaseRef.current = "";
    setFinalText("");
    setInterimText("");
    setStatus(null);
    setTip(null);
  }, []);

  const setTranscriptManual = useCallback((value: string) => {
    finalRef.current = value;
    sessionBaseRef.current = value;
    setFinalText(value);
    setInterimText("");
  }, []);

  const getTranscript = useCallback(() => finalRef.current.trim(), []);

  return {
    supported,
    listening,
    finalText,
    interimText,
    displayText: `${finalText}${interimText ? ` ${interimText}` : ""}`.trim(),
    status,
    tip,
    runtime,
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    start,
    stop,
    clearTranscript,
    setTranscriptManual,
    getTranscript,
  };
}
