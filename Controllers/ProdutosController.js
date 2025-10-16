import express from "express";
import multer from "multer";
import path from "path";
import Produto from "../models/Produtos/Produto.js";
import fs from "fs";
import adminAuth from "../middlewares/adminAuth.js";
import database from "../database/connection.js";  

const router = express.Router();

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Rota para exibir a lista de produtos na página inicial
router.get("/produtos", (req, res) => {
  Produto.findAll()
    .then((produtos) => {
      res.render("produtos/listaProdutos.ejs", { produtos });
    })
    .catch((error) => {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).send("Erro ao buscar produtos");
    });
});

// Rota para exibir detalhes do produto
router.get("/produto/:id", (req, res) => {
  const id = req.params.id;
  Produto.findByPk(id)
    .then((produto) => {
      if (!produto) {
        return res.status(404).send("Produto não encontrado");
      }
      res.render("produtos/visualizarProduto.ejs", { produto });
    })
    .catch((error) => {
      console.error("Erro ao buscar produto:", error);
      res.status(500).send("Erro ao buscar produto");
    });
});

// Rota para exibir a lista de produtos no painel administrativo
router.get("/admin/produtos", adminAuth ,(req, res) => {
  Produto.findAll()
    .then((produtos) => {
      res.render("admin/produtos/produtosAdmin.ejs", { produtos });
    })
    .catch((error) => {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).send("Erro ao buscar produtos");
    });
});

// Rota para exibir o formulário de cadastro de produto
router.get("/admin/produtos/cadastro",  adminAuth, (req, res) => {
  res.render("admin/produtos/produtoCadastro.ejs");
});

// Rota para cadastrar produto com imagem
router.post(
  "/admin/produtos/cadastro",
  adminAuth,
  upload.single("image"),
  async (req, res) => {
    try {
      const { title, description, category, stock } = req.body;

      // Corrige a formatação do preço
      let price;
      try {
        // Remove pontos de milhar e substitui vírgula decimal por ponto
        price = parseFloat(req.body.price.replace(/\./g, "").replace(",", "."));

        // Verifica se o resultado é um número válido
        if (isNaN(price)) {
          throw new Error("Formato de preço inválido");
        }
      } catch (error) {
        return res.status(400).json({
          error: "Preço inválido",
          message: "O preço deve ser um número válido (ex: 12,99 ou 12.99)",
        });
      }

      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

      const produto = await Produto.create({
        title,
        price,
        description,
        category,
        stock,
        image: imagePath,
      });

      res.redirect("/admin/produtos");
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);

      // Verifica se é um erro de validação do Sequelize
      if (
        error.name === "SequelizeValidationError" ||
        error.name === "SequelizeDatabaseError"
      ) {
        const errors = error.errors
          ? error.errors.map((err) => err.message)
          : [error.message];
        return res.status(400).json({
          error: "Erro de validação",
          details: errors,
        });
      }

      res.status(500).json({
        error: "Erro ao cadastrar produto",
        detail: error.message,
      });
    }
  }
);

// Rota para excluir produto
router.post("/admin/produtos/deletar/:id",adminAuth, (req, res) => {
  const id = req.params.id;
  Produto.findByPk(id)
    .then((produto) => {
      if (!produto) {
        return res.status(404).send("Produto não encontrado");
      }

      fs.unlink(
        "FilePath" + produto.image,
        (err) => {
          if (err) {
            console.error("Erro ao excluir imagem:", err);
          }
        }
      );
      return produto.destroy();
    })
    .then(() => {
      res.redirect("/admin/produtos"); // Redireciona para a lista de produtos após a exclusão
    })
    .catch((error) => {
      console.error("Erro ao excluir produto:", error);
      res.status(500).send("Erro ao excluir produto");
    });
});

// Rota para o formulário de edição de produto
router.get("/admin/produtos/editar/:id",adminAuth, (req, res) => {
  const id = req.params.id;
  Produto.findByPk(id)
    .then((produto) => {
      if (!produto) {
        return res.status(404).send("Produto não encontrado");
      }
      res.render("admin/produtos/produtoEditar.ejs", { produto });
    })
    .catch((error) => {
      console.error("Erro ao buscar produto:", error);
      res.status(500).send("Erro ao buscar produto");
    });
});

// Rota para editar produto com imagem
router.post(
  "/admin/produtos/edicao/:id",
  adminAuth,
  upload.single("image"),
  (req, res) => {
    const id = req.params.id;
    const { title, price, description, category, stock } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    Produto.findByPk(id)
      .then((produto) => {
        if (!produto) {
          return res.status(404).send("Produto não encontrado");
        }
        produto.title = title;
        produto.price = price;
        produto.description = description;
        produto.category = category;
        produto.stock = stock;
        if (image) {
          // Se uma nova imagem foi enviada, exclua a imagem antiga

          fs.unlink(
            "filePath" + produto.image,
            (err) => {
              if (err) {
                console.error("Erro ao excluir imagem:", err);
              }
            }
          );
          produto.image = image;
        }

        return produto.save();
      })
      .then(() => {
        res.redirect("/admin/produtos"); // Redireciona para a lista de produtos após a edição
      })
      .catch((error) => {
        console.error("Erro ao editar produto:", error);
        res.status(500).send("Erro ao editar produto");
      });
  }
);

router.get("/produtos/comprar/:id", (req, res) => {
  const id = req.params.id;
  Produto.findByPk(id)
    .then((produto) => {
      if (!produto) {
        return res.status(404).send("Produto não encontrado");
      }
      res.render("produtos/formularioCompras.ejs", { produto });
    })
    .catch((error) => {
      console.error("Erro ao buscar produto:", error);
      res.status(500).send("Erro ao buscar produto");
    });
});

router.post("/produtos/comprar/:id", (req, res) => {
  const id = req.params.id;
  const { nome, pagamento } = req.body;
  let { observacoes } = req.body;
  if (!observacoes) {
    observacoes = "...";
  }
  Produto.findByPk(id)
    .then((produto) => {
      if (!produto) {
        return res.status(404).send("Produto não encontrado");
      }
       // Decrementa o estoque do produto
      res.redirect(`https://api.whatsapp.com/send/?phone=<phoneNumber>&text=
📦 *MEU PEDIDO* 📦%0A%0A
🛒 *Produto:* ${produto.title}%0A
💰 *Preço:* R$ ${
        typeof produto.price === "number"
          ? produto.price.toFixed(2).replace(".", ",")
          : String(produto.price).replace(".", ",")
      }%0A%0A
👤 *Cliente:* ${nome}%0A
💳 *Forma de Pagamento:* ${pagamento}%0A%0A
📝 *Observações:* (${observacoes})%0A%0A
&type=phone_number&app_absent=0`);
produto.stock -= 1;
      return produto.save();
    })
    .catch((error) => {
      console.error("Erro ao buscar produto:", error);
      res.status(500).send("Erro ao buscar produto");
    });
});

router.get("/produtos/checkout", (req, res) => {
  res.render("produtos/checkoutCompras");
});

router.post("/produtos/get-cart-items", async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: "Dados do carrinho inválidos" });
    }

    // Busca os produtos no banco usando Sequelize
    const produtos = await Produto.findAll({
      where: {
        id: cartItems,
      },
      attributes: ["id", "title", "price", "image", "category"], // Seleciona apenas os campos necessários
    });

    // Mapeia para um formato simples
    const produtosFormatados = produtos.map((produto) => ({
      id: produto.id,
      title: produto.title,
      price: produto.price,
      image: produto.image,
      category: produto.category,
    }));

    res.json(produtosFormatados);
  } catch (error) {
    console.error("Erro ao buscar itens do carrinho:", error);
    res.status(500).json({ error: "Erro ao processar carrinho" });
  }
});

router.post("/produtos/checkout", async (req, res) => {
  const transaction = await database.transaction(); // Inicia uma transação
  
  try {
    const { nome, pagamento, observacoes, itens } = req.body;

    // 1. Validar dados mínimos
    if (!nome || !pagamento || !itens?.length) {
      await transaction.rollback();
      return res.status(400).json({ error: "Dados incompletos" });
    }

    // 2. Verificar estoque e preparar atualizações
    const itensSemEstoque = [];

    for (const item of itens) {
      // Busca o produto com lock para evitar race conditions
      const produto = await Produto.findByPk(item.id, {
        lock: transaction.LOCK.UPDATE,
        transaction
      });
      
      if (!produto) {
        await transaction.rollback();
        return res.status(404).json({ error: `Produto ${item.title} não encontrado` });
      }

      if (produto.stock < item.quantity) {
        itensSemEstoque.push({
          id: item.id,
          title: item.title,
          estoqueDisponivel: produto.stock,
          quantidadeSolicitada: item.quantity
        });
      }
    }

    if (itensSemEstoque.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: "Estoque insuficiente para alguns itens",
        itensSemEstoque 
      });
    }

    // 3. Atualizar estoque no banco de dados
    for (const item of itens) {
      await Produto.decrement('stock', {
        by: item.quantity,
        where: { id: item.id },
        transaction
      });
    }

    // 4. Construir mensagem para WhatsApp
    let whatsappMsg = `*NOVO PEDIDO*\n\n*Cliente:* ${nome}\n\n*Itens:*`;

    let total = 0;
    itens.forEach((item, i) => {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      
      const isPerKg = item.category && 
                     (item.category.toLowerCase().includes('fruta') || 
                      item.category.toLowerCase().includes('legume') || 
                      item.category.toLowerCase().includes('verdura'));

      whatsappMsg += `\n\n${i + 1}. ${item.title}\n${isPerKg ? 'Peso' : 'Quantidade'}: ${
        item.quantity
      } ${isPerKg ? 'kg' : 'un'}\nPreço: R$ ${item.price.toFixed(2)} ${isPerKg ? 'por kg' : 'cada'}`;
    });

    whatsappMsg += `\n\n*Total: R$ ${total.toFixed(2)}*\n*Pagamento:* ${pagamento}`;

    if (observacoes && observacoes.trim() !== "") {
      whatsappMsg += `\n*Observações:* ${observacoes}`;
    }

    // 5. Criar URL do WhatsApp
    const whatsappUrl = `https://wa.me/<phoneNumber>?text=${encodeURIComponent(whatsappMsg)}`;

    // 6. Commit da transação se tudo ocorrer bem
    await transaction.commit();

    // 7. Responder com a URL para redirecionamento
    res.json({ success: true, whatsappUrl });

  } catch (error) {
    await transaction.rollback();
    console.error("Erro:", error);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

router.get("/", (req, res) => {
  res.render("home/home.ejs");
});


export default router;
