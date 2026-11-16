import classNames from "classnames";
import React from "react";

export type JalakMood =
  "biasa" | "senang" | "bangga" | "sedih" | "berpikir" | "bicara";

type JalakProps = {
  mood?: JalakMood;
  size?: 48 | 64 | 96;
  className?: string;
};

/**
 * Jalak, the mascot, for a handful of moments (results, empty and error
 * states). Pure decoration: the message beside it must say everything on its
 * own. Loaded as a static file from public/brand (cached by the service
 * worker), so the six faces add nothing to the JS bundle. Rises in once;
 * still under prefers-reduced-motion.
 */
const Jalak = ({ mood = "biasa", size = 64, className }: JalakProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={`/brand/jalak-${mood}.svg`}
    width={size}
    height={size}
    alt=""
    aria-hidden
    data-jalak={mood}
    className={classNames(
      "block shrink-0 animate-[jalak-in_200ms_var(--ease-lompat)]",
      className,
    )}
  />
);

export default Jalak;
