import express from "express";

const app = express();
app.get("/", (req, res) => {
   res.send("Hello");
});

app.listen(8000, () => {
   console.log("Server is now running.");
});
