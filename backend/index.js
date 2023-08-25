import app from "./server.js";
import dotenv from "dotenv";

dotenv.config();

app.listen(process.env.PORT || 3019, () => {
  console.log(`App is listening to port ${process.env.PORT}`);
});
