import React from "react";

interface RichProps {
  text: string;
  boldClassName?: string;
}

// Renders a string containing <b>…</b> markers without innerHTML.
const Rich = React.memo(({ text, boldClassName = "text-green" }: RichProps) => (
  <>
    {text.split(/(<b>.*?<\/b>)/g).map((p, i) =>
      p.startsWith("<b>") ? (
        <b key={i} className={boldClassName}>
          {p.slice(3, -4)}
        </b>
      ) : (
        <span key={i}>{p}</span>
      ),
    )}
  </>
));

Rich.displayName = "Rich";

export default Rich;
