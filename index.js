import express from "express";
const app = express();
import connection from "./database/connection.js";
import session from "express-session";
import ProdutosController from "./Controllers/ProdutosController.js";
import cors from "cors";
import UsersController from "./Controllers/UsersController.js"; 

connection
  .authenticate()
  .then(() => {
    console.log("connection success");
  })
  .catch((error) => {
    console.log(error);
  });

app.use(cors());
app.use(express.static("public")); // Para servir arquivos estáticos
app.use("/uploads", express.static("uploads")); // Para servir imagens
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: "teste",
    cookie: { maxAge: 30000000 },
  })
);

app.use((req, res, next) => {
    // Isso torna 'user' disponível em todos os templates
    res.locals.user = req.session.user || null;
    next();
});
app.use("/", ProdutosController);
app.use("/", UsersController);


app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("home/home.ejs");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
