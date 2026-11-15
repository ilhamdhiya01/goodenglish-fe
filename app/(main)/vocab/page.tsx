import { Quiz } from "@/components/features/quiz";
import { Vocab } from "@/components/features/vocab";

const VocabPage = () => (
  <div className="flex flex-col gap-6">
    <Quiz.QuickTestBar />
    <Quiz.QuizPanel />
    <Vocab.VocabPage />
  </div>
);

export default VocabPage;
