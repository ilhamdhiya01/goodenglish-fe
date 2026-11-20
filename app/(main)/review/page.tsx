import { Suspense } from "react";

import { Review } from "@/components/features/review";

// ReviewPage reads ?kuis, which needs a Suspense boundary.
const Page = () => (
  <Suspense>
    <Review.ReviewPage />
  </Suspense>
);

export default Page;
