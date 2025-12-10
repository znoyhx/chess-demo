import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DANMAKU_TEXTS = [
  "就这？",
  "快点啊我等的花都谢了",
  "不会下别下",
  "菜！",
  "急了急了",
  "全屏嘲讽!",
  "心态崩了?",
  "大意了没有闪",
];

const MIN_ROWS = 10;
const MAX_ROWS = 15;

interface DanmakuConfig {
  id: string;
  text: string;
  top: string;
  duration: number;
  delay: number;
  fontSize: string;
}

export interface DanmakuOverlayProps {
  active: boolean;
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export const DanmakuOverlay = ({ active }: DanmakuOverlayProps) => {
  const configs = useMemo(() => {
    const count = Math.floor(randomBetween(MIN_ROWS, MAX_ROWS + 1));
    return Array.from({ length: count }).map<DanmakuConfig>((_, index) => {
      const text = DANMAKU_TEXTS[index % DANMAKU_TEXTS.length];
      const top = `${Math.floor(randomBetween(0, 90))}%`;
      const duration = randomBetween(3, 8);
      const delay = randomBetween(0, 2);
      const fontSize = `${randomBetween(1.6, 2.6)}rem`;
      return {
        id: `${text}-${index}-${top}`,
        text,
        top,
        duration,
        delay,
        fontSize,
      };
    });
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="danmaku-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      >
        {configs.map(({ id, text, top, duration, delay, fontSize }) => (
          <motion.span
            key={id}
            className="absolute select-none font-bold text-red-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.65)]"
            style={{ top, fontSize }}
            initial={{ x: "110vw", opacity: 0.8 }}
            animate={{ x: "-110%", opacity: [1, 1, 0.9] }}
            transition={{
              duration,
              ease: "linear",
              delay,
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            {text}
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
