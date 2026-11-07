"use client";

import dynamic from "next/dynamic";
import type { GradientASCIIProps } from "../reactbits/GradientASCII";

const GradientASCII = dynamic(() => import("../reactbits/GradientASCII"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-background" aria-hidden="true" />,
});

/**
 * Client island for the WebGL-backed Gradient ASCII background.
 * Renders empty until hydration; the component itself falls back
 * gracefully when WebGL2 is unavailable.
 */
export default function AsciiField(props: GradientASCIIProps) {
  return (
    <GradientASCII {...props} />
  );
}
