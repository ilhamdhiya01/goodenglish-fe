import { notFound } from "next/navigation";

import UiGallery from "@/components/dev/UiGallery";

// Primitive gallery: only in `next dev`, or in a build made with
// NEXT_PUBLIC_DEV_UI=1 (the E2E build checks it with axe and the keyboard).
const DevUiPage = () => {
  if (
    process.env.NODE_ENV !== "development" &&
    process.env.NEXT_PUBLIC_DEV_UI !== "1"
  ) {
    notFound();
  }
  return <UiGallery />;
};

export default DevUiPage;
