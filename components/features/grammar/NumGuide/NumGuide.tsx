import React from "react";

import GrammarDetail from "@/components/features/grammar/GrammarDetail/GrammarDetail";
import Numbers from "@/components/features/grammar/Numbers/Numbers";
import { DETAIL } from "@/const/grammar.constant";

// Sub-tab "Angka": cardinal/ordinal dulu, lalu detail cara mengucapkan angka.
const NumGuide = React.memo(() => {
  return (
    <>
      <Numbers />
      <GrammarDetail d={DETAIL.num} />
    </>
  );
});

NumGuide.displayName = "NumGuide";

export default NumGuide;
