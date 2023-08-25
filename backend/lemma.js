import { readFileSync, writeFileSync } from "fs";
import { isStopword } from "./stopwords.js";
import lemmatizer from "node-lemmatizer";

export function lemmatizeText(textFilePath, lemmasFilePath) {
  const text = readFileSync(textFilePath, "utf-8");

  const lemmas = text
    .split(/ |\n/)
    .map((word) => word.replaceAll(/\(|\)|,|\.|“|”|;|:|‘|’|"/g, ""))
    .filter((word) => word && !isStopword(word))
    .map(lemmatizeWord);

  const lemmatized = lemmas.join(" ");

  writeFileSync(lemmasFilePath, lemmatized);
}

export function lemmatizeWord(value) {
  return lemmatizer.only_lemmas(value.toLowerCase(), "verb").join(" ");
}
