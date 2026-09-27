import express from "express";
import path from "path";
import router from "./routes/index.js";
import { config } from "./config/env.config.js";
import errorHandler from "./middleware/errorHandler.js";
import { connectDB } from "./config/database.config.js";

const app = express();

app.use(express.json());
app.use("/api", router);

app.use('/upload', express.static(path.join(process.cwd(), 'upload')));
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  app.listen(config.app.port, () => {
    console.log(`Server is running on port http://localhost:${config.app.port}`);
  });
};

startServer();


