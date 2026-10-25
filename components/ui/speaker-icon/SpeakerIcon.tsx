import React, { forwardRef } from "react";

const SpeakerIcon = forwardRef<SVGSVGElement, { size?: number }>(
  ({ size = 13 }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 5L6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    </svg>
  ),
);

SpeakerIcon.displayName = "SpeakerIcon";

export default SpeakerIcon;
