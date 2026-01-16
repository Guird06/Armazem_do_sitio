import express from "express";
const app = express();

import "dotenv/config";
import connection from "./database/connection.js";
import session from "express-session";
import ProdutosController from "./Controllers/ProdutosController.js";
import UsersController from "./Controllers/UsersController.js";
import cors from "cors";

(async () => {
  try {
    await connection.authenticate();
    console.log("connection success");
  } catch (error) {
    console.log(error);
  }
})();

app.use(cors());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.set("view engine", "ejs");

app.use("/", ProdutosController);
app.use("/", UsersController);

app.get("/", (req, res) => {
  res.render("home/home.ejs");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

