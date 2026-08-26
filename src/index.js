import express from "express";
import router from "./routes/index.js";

const app = express();

app.use(express.json());
app.use("/api", router);


// app.use((req, res, next) => {
//   console.log("Global Middleware");
//   next();  
// })

// route  
// app.use(  
//     "/test",  
//     (req, res, next) => {  
//         console.log("Route middleware 1");  
//         next();  
//     },  
//     (req, res) => {  
//         res.send("Test api");  
//     }  
// );

// app.use(  
//     "/divine",  
//     (req, res, next) => {  
//         const { a, b } = req.query;
//         if ( b == 0 ) {
//           throw new Error("Division by zero is not allowed");
//         }
//         next();  
//     },  
//     (req, res) => {  
//         res.send("Test api");  
//     }  
// );

// error handling middleware
// app.use((err, req, res, next) => {
//   console.log(err.message);
//   res.send("Internal server error");
// });

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
