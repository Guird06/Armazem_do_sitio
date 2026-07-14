import express from "express";
import SalesController from "../Controllers/SalesController.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/admin/sales", adminAuth, SalesController.salesDashboard.bind(SalesController));
router.get("/admin/sales/list", adminAuth, SalesController.salesList.bind(SalesController));
router.post("/admin/sales/confirm/:id", adminAuth, SalesController.confirmSale.bind(SalesController));
router.post("/admin/sales/cancel/:id", adminAuth, SalesController.cancelSale.bind(SalesController));

export default router;
