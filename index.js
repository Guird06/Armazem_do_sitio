import express from "express";
import "dotenv/config";
import connection from "./database/connection.js";
import session from "express-session";
import cors from "cors";
import ProductsRoutes from "./routes/ProductsRoutes.js";
import SalesRoutes from "./routes/SalesRoutes.js";
import UsersRoutes from "./routes/UsersRoutes.js";

const app = express();

// Database authentication and model sync
(async () => {
  try {
    await connection.authenticate();
    await connection.sync({ alter: true });
    console.log("Database connected successfully");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
})();

// Middleware setup
app.use(cors());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
  })
);

// User session in view
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// View engine setup
app.set("view engine", "ejs");

// Routes
app.use("/", ProductsRoutes);
app.use("/", SalesRoutes);
app.use("/", UsersRoutes);


