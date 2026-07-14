import "dotenv/config";
import multer from "multer";
import path from "path";
import Product from "../models/Products/Product.js";
import Sale from "../models/Sales/Sale.js";
import fs from "fs";
import database from "../database/connection.js";

class ProductsController {
    constructor() {
        const storage = multer.diskStorage({
            destination: this.multerDestination,
            filename: this.multerFilename,
        });
        this.upload = multer({ storage });
    }

    multerDestination(req, file, cb) {
        cb(null, "uploads/");
    }

    multerFilename(req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }

    async list(req, res) {
        try {
            const products = await Product.findAll();
            return res.render("products/productsList.ejs", { products });
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            return res.status(500).send("Erro ao buscar produtos");
        }
    }

    async detail(req, res) {
        try {
            const id = req.params.id;
            const product = await Product.findByPk(id);
            
            if (!product) {
                return res.status(404).send("Produto não encontrado");
            }
            
            return res.render("products/productDetail.ejs", { product });
        } catch (error) {
            console.error("Erro ao buscar produto:", error);
            return res.status(500).send("Erro ao buscar produto");
        }
    }

    async adminList(req, res) {
        try {
            const products = await Product.findAll();
            return res.render("admin/products/productsAdmin.ejs", { products });
        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
            return res.status(500).send("Erro ao buscar produtos");
        }
    }

    registrationForm(req, res) {
        return res.render("admin/products/productRegistration.ejs");
    }

    async create(req, res) {
        try {
            const { title, description, category, stock } = req.body;
            let price;
            try {
                price = this.parsePrice(req.body.price);
                if (isNaN(price)) throw new Error("Formato de preço inválido");
            } catch (error) {
                return res.status(400).json({ 
                    error: "Preço inválido", 
                    message: "O preço deve ser um número válido (ex: 12,99 ou 12.99)" 
                });
            }
            const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
            await Product.create({ title, price, description, category, stock, image: imagePath });
            return res.redirect("/admin/products");
        } catch (error) {
            console.error("Erro ao cadastrar produto:", error);
            if (error.name === "SequelizeValidationError" || error.name === "SequelizeDatabaseError") {
                const errors = this.extractErrorMessages(error);
                return res.status(400).json({ error: "Erro de validação", details: errors });
            }
            return res.status(500).json({ error: "Erro ao cadastrar produto", detail: error.message });
        }
    }

    parsePrice(priceString) {
        return parseFloat(priceString.replace(/\./g, "").replace(",", "."));
    }

    extractErrorMessages(error) {
        return error.errors ? error.errors.map(err => err.message) : [error.message];
    }

    async delete(req, res) {
        try {
            const id = req.params.id;
            const product = await Product.findByPk(id);
            if (!product) return res.status(404).send("Produto não encontrado");
            this.deleteProductImage(product.image);
            await product.destroy();
            return res.redirect("/admin/products");
        } catch (error) {
            console.error("Erro ao excluir produto:", error);
            return res.status(500).send("Erro ao excluir produto");
        }
    }

    deleteProductImage(imagePath) {
        fs.unlink("FilePath" + imagePath, (err) => {
            if (err) console.error("Erro ao excluir imagem:", err);
        });
    }

    async editForm(req, res) {
        try {
            const id = req.params.id;
            const product = await Product.findByPk(id);
            
            if (!product) {
                return res.status(404).send("Produto não encontrado");
            }
            
            return res.render("admin/products/productEdit.ejs", { product });
        } catch (error) {
            console.error("Erro ao buscar produto:", error);
            return res.status(500).send("Erro ao buscar produto");
        }
    }

    async update(req, res) {
        try {
            const id = req.params.id;
            const { title, price, description, category, stock } = req.body;
            const image = req.file ? `/uploads/${req.file.filename}` : null;
            const product = await Product.findByPk(id);
            
            if (!product) return res.status(404).send("Produto não encontrado");
            
            product.title = title;
            product.price = price;
            product.description = description;
            product.category = category;
            product.stock = stock;
            
            if (image) {
                this.deleteProductImage(product.image);
                product.image = image;
            }
            
            await product.save();
            return res.redirect("/admin/products");
        } catch (error) {
            console.error("Erro ao editar produto:", error);
            return res.status(500).send("Erro ao editar produto");
        }
    }

    async purchaseForm(req, res) {
        try {
            const id = req.params.id;
            const product = await Product.findByPk(id);
            
            if (!product) {
                return res.status(404).send("Produto não encontrado");
            }
            
            return res.render("products/purchaseForm.ejs", { product });
        } catch (error) {
            console.error("Erro ao buscar produto:", error);
            return res.status(500).send("Erro ao buscar produto");
        }
    }

    async purchase(req, res) {
        try {
            const id = req.params.id;
            const { name, payment } = req.body;
            let { notes } = req.body;
            if (!notes) notes = "...";
            
            const product = await Product.findByPk(id);
            if (!product) return res.status(404).send("Produto não encontrado");
            
            // Registrar venda como pendente
            await Sale.create({
                customerName: name,
                paymentMethod: payment,
                notes: notes,
                items: [
                    {
                        id: product.id,
                        title: product.title,
                        price: parseFloat(product.price),
                        quantity: 1,
                        category: product.category
                    }
                ],
                total: parseFloat(product.price),
                status: 'pending'
            });
            
            const msgUrl = this.buildWhatsappUrl(product, name, payment, notes);
            
            product.stock -= 1;
            await product.save();
            return res.redirect(msgUrl);
        } catch (error) {
            console.error("Erro ao processar compra:", error);
            return res.status(500).send("Erro ao processar compra");
        }
    }

    buildWhatsappUrl(product, name, payment, notes) {
        const price = typeof product.price === 'number' 
            ? product.price.toFixed(2).replace('.', ',') 
            : String(product.price).replace('.', ',');
        
        const whatsappNumber = process.env.WHATSAPP_NUMBER || '5543999753016';
        const text = `\n📦 *MEU PEDIDO* 📦%0A%0A🛒 *Produto:* ${product.title}%0A💰 *Preço:* ${price}%0A%0A👤 *Cliente:* ${name}%0A💳 *Forma de Pagamento:* ${payment}%0A%0A📝 *Observações:* (${notes})%0A%0A`;
        
        return `https://api.whatsapp.com/send/?phone=${whatsappNumber}&text=${text}&type=phone_number&app_absent=0`;
    }

    checkoutPage(req, res) {
        return res.render("products/checkoutPurchase");
    }

    async getCartItems(req, res) {
        try {
            const { cartItems } = req.body;
            if (!cartItems || !Array.isArray(cartItems)) {
                return res.status(400).json({ error: "Dados do carrinho inválidos" });
            }
            
            const products = await Product.findAll({
                where: { id: cartItems },
                attributes: ["id", "title", "price", "image", "category"]
            });
            
            const formattedProducts = this.formatCartProducts(products);
            return res.json(formattedProducts);
        } catch (error) {
            console.error("Erro ao buscar itens do carrinho:", error);
            return res.status(500).json({ error: "Erro ao processar carrinho" });
        }
    }

    formatCartProducts(products) {
        return products.map(product => ({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            category: product.category
        }));
    }

    async checkout(req, res) {
        const transaction = await database.transaction();
        try {
            const { name, payment, notes, items } = req.body;
            
            if (!name || !payment || !items?.length) {
                await transaction.rollback();
                return res.status(400).json({ error: "Dados incompletos" });
            }
            
            const itemsOutOfStock = await this.checkStockAvailability(items, transaction);
            
            if (itemsOutOfStock.length > 0) {
                await transaction.rollback();
                return res.status(400).json({ 
                    error: "Estoque insuficiente para alguns itens", 
                    itemsOutOfStock 
                });
            }
            
            await this.decrementStock(items, transaction);
            
            const { whatsappMessage, total } = this.buildCheckoutMessage(name, payment, notes, items);
            
            // Registrar venda como pendente
            await Sale.create({
                customerName: name,
                paymentMethod: payment,
                notes: notes || null,
                items: items,
                total: total,
                status: 'pending'
            }, { transaction });
            
            const whatsappNumber = process.env.WHATSAPP_NUMBER || '5543999753016';
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
            
            await transaction.commit();
            return res.json({ success: true, whatsappUrl });
        } catch (error) {
            await transaction.rollback();
            console.error("Erro:", error);
            return res.status(500).json({ error: "Erro no servidor" });
        }
    }

    async checkStockAvailability(items, transaction) {
        const itemsOutOfStock = [];
        
        for (const item of items) {
            const product = await Product.findByPk(item.id, {
                lock: transaction.LOCK.UPDATE,
                transaction
            });
            
            if (!product) {
                throw new Error(`Produto ${item.title} não encontrado`);
            }
            
            if (product.stock < item.quantity) {
                itemsOutOfStock.push({
                    id: item.id,
                    title: item.title,
                    availableStock: product.stock,
                    requestedQuantity: item.quantity
                });
            }
        }
        
        return itemsOutOfStock;
    }

    async decrementStock(items, transaction) {
        for (const item of items) {
            await Product.decrement('stock', {
                by: item.quantity,
                where: { id: item.id },
                transaction
            });
        }
    }

    buildCheckoutMessage(name, payment, notes, items) {
        let whatsappMessage = `*NOVO PEDIDO*\n\n*Cliente:* ${name}\n\n*Itens:*`;
        let total = 0;
        
        items.forEach((item, i) => {
            const subtotal = item.price * item.quantity;
            total += subtotal;
            
            const unit = this.getUnitByCategory(item.category);
            whatsappMessage += `\n\n${i + 1}. ${item.title}\n${unit.label}: ${item.quantity} ${unit.symbol}\nPreço: R$ ${item.price.toFixed(2)} ${unit.priceLabel}`;
        });
        
        whatsappMessage += `\n\n*Total: R$ ${total.toFixed(2)}*\n*Pagamento:* ${payment}`;
        
        if (notes && notes.trim() !== "") {
            whatsappMessage += `\n*Observações:* ${notes}`;
        }
        
        return { whatsappMessage, total };
    }

    getUnitByCategory(category) {
        const isFruitOrVegetable = category && 
            (category.toLowerCase().includes('fruta') || 
             category.toLowerCase().includes('legume') || 
             category.toLowerCase().includes('verdura'));
        
        if (isFruitOrVegetable) {
            return { label: 'Peso', symbol: 'kg', priceLabel: 'por kg' };
        }
        return { label: 'Quantidade', symbol: 'un', priceLabel: 'cada' };
    }

    home(req, res) {
        return res.render("home/home.ejs");
    }
}

export default new ProductsController();
