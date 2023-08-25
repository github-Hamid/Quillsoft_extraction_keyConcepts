import { toString } from "nlcst-to-string";
import { retext } from "retext";
import retextKeywords from "retext-keywords";
import retextPos from "retext-pos";
import fs from "fs";
import { textContainAuxiliaryVerbs } from "./auxiliaryverbs.js";
import { isStopword } from "./stopwords.js";
import isSpecialChars from "./specialChars.js";
import { fileURLToPath } from "url";
import { writeFileSync, mkdirSync, mkdtempSync, rmSync, fstat } from "fs";
import { promisify } from "util";
import { lemmatizeText, lemmatizeWord } from "./lemma.js";
import word2vec from "word2vec";
import lemmatizer from "node-lemmatizer";
import path from "path";
//CONST
const KEY_COUNT_MAX = 140;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const CACHE_DIR = path.join(ROOT_DIR, ".cache-files");

const PREFIX_CACHE = "f-";

const FILE_NAME_LEMMAS = "lemmas.txt";
const FILE_NAME_PHRASES = "phrases.txt";
const CBOW_FILE_NAME_VECTORS = "CBOW vectors.txt";
const SKIP_GRAM_FILE_NAME_VECTORS = "Skip Gram vectors.txt";

const MAX_SIZE_OF_DATA = 20;
const CBOW_VECTOR_OPTIONS = {
  cbow: 1, //1
  size: 1000, //1000
  window: 5, //5
  negative: 25, //25
  hs: 0, //0
  sample: 1e-4, //1e-4
  threads: 20, //20
  iter: 15, //15
  minCount: 1, //1
  debug: 0, //0
};

const SKIP_GRAM_VECTOR_OPTIONS = {
  cbow: 0,
  size: 1000,
  window: 5,
  negative: 25,
  hs: 0,
  sample: 1e-4,
  threads: 20,
  iter: 15,
  minCount: 1,
  debug: 0,
};

/** METHODS */

// const writePhrases = promisify(word2vec.word2phrase);
const writeVectors = promisify(word2vec.word2vec);
const readModel = promisify(word2vec.loadModel);

export async function getCluster(maximumNumOfWords, text, numOfKeywords) {
  try {
    // Call the function to delete subdirectories within the parent folder
    deleteFolderRecursive(CACHE_DIR);
    mkdirSync(CACHE_DIR, { recursive: true });
    const cachePrefix = path.join(CACHE_DIR, PREFIX_CACHE);
    const cacheDir = mkdtempSync(cachePrefix);
    const { keywordTexts, conceptTexts } = await getConcepts(
      maximumNumOfWords,
      text
    );

    const lemmasPath = path.join(cacheDir, FILE_NAME_LEMMAS);
    const phrasesPath = path.join(cacheDir, FILE_NAME_PHRASES);

    const CBOWVectorsPath = path.join(cacheDir, CBOW_FILE_NAME_VECTORS);
    const SkipGramVectorsPath = path.join(
      cacheDir,
      SKIP_GRAM_FILE_NAME_VECTORS
    );

    const keyconceptsOccurences = [];
    writePhrases(text, phrasesPath, conceptTexts, keyconceptsOccurences);

    lemmatizeText(phrasesPath, lemmasPath);

    // writing vectors for CBOW and Skip Gram models
    await writeVectors(lemmasPath, CBOWVectorsPath, CBOW_VECTOR_OPTIONS);
    await writeVectors(
      lemmasPath,
      SkipGramVectorsPath,
      SKIP_GRAM_VECTOR_OPTIONS
    );

    // reading models
    const CBOWModel = await readModel(CBOWVectorsPath);
    const SkipGramModel = await readModel(SkipGramVectorsPath);

    let rankedConcepts = conceptTexts.map((conceptText) => {
      const normalizedPhrase = normalizePhrase(conceptText);

      // getting scores for each keyword
      let rankedKeywords = keywordTexts.map((keywordText) => {
        const normalizedWord = normalizeWord(keywordText);
        const CBOWScore =
          CBOWModel.similarity(normalizedPhrase, normalizedWord) ?? 0;
        const SkipGramScore =
          SkipGramModel.similarity(normalizedPhrase, normalizedWord) ?? 0;

        return { keywordText, CBOWScore, SkipGramScore };
      });

      // sorting the keywords based on scores
      rankedKeywords = rankedKeywords
        .sort((a, b) => {
          let valueB;
          let valueA;
          if (b.CBOWScore > 0 && b.SkipGramScore > 0) {
            valueB = Math.sqrt(b.CBOWScore * b.SkipGramScore);
          } else {
            valueB =
              -1 * Math.sqrt(Math.abs(b.CBOWScore) * Math.abs(b.SkipGramScore));
          }
          if (a.CBOWScore > 0 && b.SkipGramScore > 0) {
            valueA = Math.sqrt(a.CBOWScore * a.SkipGramScore);
          } else {
            valueA =
              -1 * Math.sqrt(Math.abs(a.CBOWScore) * Math.abs(a.SkipGramScore));
          }

          return valueB - valueA;
        })
        .slice(
          0,
          rankedKeywords.length > numOfKeywords
            ? numOfKeywords
            : rankedKeywords.length
        );

      const keywords = rankedKeywords.map(({ keywordText }) => {
        const lowerCase = keywordText.toLowerCase();
        const lemmaText = lemmatizer.only_lemmas(lowerCase, "noun");

        return lemmaText;
      });

      return {
        text: conceptText,
        keywords,
      };
    });

    return { rankedConcepts, keywordTexts };
  } catch (error) {
    console.log("error:", error);
  }
}

export function mergeKeywordScores(CBOWScore, SkipGramScore) {
  return Math.sqrt(Math.abs(CBOWScore) * Math.abs(SkipGramScore));
}

export function normalizePhrase(value) {
  return value.replaceAll(" ", "_").toLowerCase();
}

export function normalizeWord(value) {
  return lemmatizeWord(value);
}

function writePhrases(
  text,
  phrasesFilePath,
  conceptTexts,
  keyconceptsOccurences
) {
  for (const keyPhrase of conceptTexts) {
    const normalized = normalizePhrase(keyPhrase);
    const pattern = normalized.replaceAll("_", "[ _]");

    text = text.replaceAll(RegExp(pattern, "gi"), normalized);

    let count = 0;
    let index = text.indexOf(normalized);

    while (index !== -1) {
      count++;
      index = text.indexOf(normalized, index + 1);
    }
    keyconceptsOccurences.push([keyPhrase, count, 0]);
  }

  writeFileSync(phrasesFilePath, text);
}

async function getConcepts(maximumNumOfWords, text) {
  const keywordTexts = [];
  const conceptTexts = [];

  const { data } = await retext()
    .use(retextPos)
    .use(retextKeywords, { maximum: KEY_COUNT_MAX })
    .process(text);

  data?.keywords?.forEach((keyword) => {
    const word = toString(keyword.matches[0].node).trim();
    if (!word || isStopword(word) || isSpecialChars(word)) return;

    keywordTexts.push(word);
  });

  data?.keyphrases?.forEach((keyPhrase) => {
    const concept = keyPhrase.matches[0].nodes
      .map((content) => toString(content))
      .join("")
      .trim();

    const isUnigram = !concept.includes(" ");
    const isOneLine = !concept.includes("\n");

    if (isUnigram || !isOneLine || textContainAuxiliaryVerbs(concept)) return;

    if (maximumNumOfWords && concept.split(" ").length > maximumNumOfWords)
      return;

    conceptTexts.push(concept);
  });

  return { keywordTexts, conceptTexts };
}

async function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const currentPath = path.join(folderPath, file);

      if (fs.lstatSync(currentPath).isDirectory()) {
        // If it's a directory, recursively delete it
        deleteFolderRecursive(currentPath);
      } else {
        // If it's a file, delete it
        fs.unlinkSync(currentPath);
        console.log(`Deleted file: ${currentPath}`);
      }
    });

    // After processing all files and subdirectories, remove the empty folder
    fs.rmdirSync(folderPath);
    console.log(`Deleted directory: ${folderPath}`);
  }
}
