import { Suspense } from "react";

import { Access } from "@/components/features/access";

// AccessForm reads ?callbackUrl, which needs a Suspense boundary.
const AccessPage = () => (
  <Suspense>
    <Access.AccessForm />
  </Suspense>
);

export default AccessPage;
