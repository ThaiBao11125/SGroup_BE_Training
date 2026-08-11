import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("<a href='/about-me'>About Me</a>");
});

app.get("/about-me", (req, res) => {
  res.send("<h1>About Me</h1><p>This is the about me page.</p>");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

