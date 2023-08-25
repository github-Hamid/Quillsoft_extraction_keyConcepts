import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import { getCluster } from "./cluster.js";
export const KEY_COUNT_MAX = 140;

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post("/keyConcepts", async (req, res) => {
  const { maximumNumOfWords, text, numOfKeywords } = req.body;

  const rankedConcepts = await getCluster(
    maximumNumOfWords,
    text,
    numOfKeywords
  );

  res.json(rankedConcepts);
});

export default app;
