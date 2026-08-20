import express from "express";
import { readData } from "./utils/readData.js";
import router from "./src/routes/index.js";

const app = express();

app.use(express.json());
app.use("/api", router);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
