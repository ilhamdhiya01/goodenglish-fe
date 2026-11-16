import AnswerOption from "./answer-option";
import Correction from "./correction";
import ListItem from "./list-item";
import TargetMark from "./target-mark";
import WordTile from "./word-tile";

// Composite patterns built from the ui primitives, shared across screens.
export const Patterns = {
  AnswerOption,
  Correction,
  ListItem,
  TargetMark,
  WordTile,
} as const;
