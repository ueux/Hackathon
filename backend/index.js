import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";
dotenv.config({});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR: ", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
     console.log( `App is Listening On port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGO DB connection failed !!!", error);
  });
