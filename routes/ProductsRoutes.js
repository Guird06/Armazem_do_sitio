import express from "express";
import ProductsController from "../Controllers/ProductsController.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/products", ProductsController.list.bind(ProductsController));
router.get("/product/:id", ProductsController.detail.bind(ProductsController));
router.get("/admin/products", adminAuth, ProductsController.adminList.bind(ProductsController));
router.get("/admin/products/registration", adminAuth, ProductsController.registrationForm.bind(ProductsController));
router.post("/admin/products/registration", adminAuth, ProductsController.upload.single("image"), ProductsController.create.bind(ProductsController));
router.post("/admin/products/delete/:id", adminAuth, ProductsController.delete.bind(ProductsController));
router.get("/admin/products/edit/:id", adminAuth, ProductsController.editForm.bind(ProductsController));
router.post("/admin/products/edit/:id", adminAuth, ProductsController.upload.single("image"), ProductsController.update.bind(ProductsController));
router.get("/products/purchase/:id", ProductsController.purchaseForm.bind(ProductsController));
router.post("/products/purchase/:id", ProductsController.purchase.bind(ProductsController));
router.get("/products/checkout", ProductsController.checkoutPage.bind(ProductsController));
router.post("/products/get-cart-items", ProductsController.getCartItems.bind(ProductsController));
router.post("/products/checkout", ProductsController.checkout.bind(ProductsController));
router.get("/", ProductsController.home.bind(ProductsController));

export default router;
