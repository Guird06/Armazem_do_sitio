import express from "express";
import UsersController from "../Controllers/UsersController.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/admin/login", UsersController.showLogin.bind(UsersController));
router.post("/admin/login", UsersController.login.bind(UsersController));
router.get("/admin/register", adminAuth, UsersController.showRegister.bind(UsersController));
router.post("/admin/register", adminAuth, UsersController.register.bind(UsersController));
router.get("/admin/manage", adminAuth, UsersController.adminDashboard.bind(UsersController));
router.get("/admin/users", adminAuth, UsersController.adminListUsers.bind(UsersController));
router.post("/admin/users/delete/:id", adminAuth, UsersController.deleteAdmin.bind(UsersController));
router.get("/logout", adminAuth, UsersController.logout.bind(UsersController));

export default router;
