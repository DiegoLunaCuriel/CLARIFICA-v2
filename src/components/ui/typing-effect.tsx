"use client";

import { useEffect, useState, useCallback } from "react";

const DEFAULT_PHRASES = [
  "taladro percutor profesional...",
  "cemento para losa 50kg...",
  "pintura exterior lavable...",
  "sierra circular 7¼...",
  "impermeabilizante para techo...",
];

export function useTypingPlaceholder(
  phrases: string[] = DEFAULT_PHRASES,
  typingSpeed = 65,
  deleteSpeed = 35,
  pauseTime = 1800
) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const tick = useCallback(() => {
    const current = phrases[phraseIdx];

    if (!isDeleting) {
      // Typing forward
      if (text.length < current.length) {
        return setTimeout(() => setText(current.slice(0, text.length + 1)), typingSpeed);
      }
      // Finished typing — pause then start deleting
      return setTimeout(() => setIsDeleting(true), pauseTime);
    }

    // Deleting
    if (text.length > 0) {
      return setTimeout(() => setText(text.slice(0, -1)), deleteSpeed);
    }
    // Finished deleting — move to next phrase
    setIsDeleting(false);
    setPhraseIdx((prev) => (prev + 1) % phrases.length);
    return undefined;
  }, [text, phraseIdx, isDeleting, phrases, typingSpeed, deleteSpeed, pauseTime]);

  useEffect(() => {
    const timer = tick();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [tick]);

  return text;
}

export function TypingPlaceholder({
  phrases,
  className,
}: {
  phrases?: string[];
  className?: string;
}) {
  const text = useTypingPlaceholder(phrases);

  return (
    <span className={className}>
      {text}
      <span
        className="inline-block w-[2px] h-[1em] bg-blue-400 ml-[1px] align-text-bottom"
        style={{ animation: "blink-cursor 0.8s step-end infinite" }}
      />
    </span>
  );
}
