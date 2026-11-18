// One page-scroll lock shared by every dialog, sheet and full-screen test.
// Counted, so they can open and close in any order: the page scrolls again
// once the last one is gone. (Each saving and restoring body.overflow on its
// own left the page stuck when a dialog closed after the screen under it.)

let count = 0;
let saved = "";

/** Stop the page behind from scrolling; call the result to release. */
export const lockScroll = (): (() => void) => {
  if (count === 0) saved = document.body.style.overflow;
  count++;
  document.body.style.overflow = "hidden";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count = Math.max(0, count - 1);
    if (count === 0) document.body.style.overflow = saved;
  };
};
