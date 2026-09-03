import express from "express";
import router from "./routes/index.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

app.use(express.json());
app.use("/api", router);

// Error-handling middleware
app.use(errorHandler);

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
