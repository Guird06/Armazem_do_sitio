import bcrypt from "bcryptjs";
import Users from "../models/Admin/Users.js";
import adminAuth from "../middlewares/adminAuth.js";

class UsersController {
    showLogin(req, res) {
        const message = req.query.registered ? "Administrador cadastrado com sucesso. Faça login." : null;
        res.render("admin/login/login.ejs", { error: null, message });
    }

    async login(req, res) {
        try {
            const loginCredential = req.body.login;
            const password = req.body.password;
            const user = await Users.findOne({ where: { login: loginCredential } });
            if (user) {
                const correct = await bcrypt.compare(password, user.password);
                if (correct) {
                    req.session.user = { id: user.id, login: user.login };
                    return res.redirect("/admin/manage");
                }
            }
            return res.render("admin/login/login.ejs", { error: "Usuário ou senha inválidos.", message: null });
        } catch (error) {
            console.error(error);
            return res.render("admin/login/login.ejs", { error: "Ocorreu um erro ao tentar entrar. Tente novamente.", message: null });
        }
    }

    adminDashboard(req, res) {
        return res.render("admin/dashboard.ejs");
    }

    async adminListUsers(req, res) {
        try {
            const admins = await Users.findAll({ order: [["id", "ASC"]] });
            return res.render("admin/users/usersAdmin.ejs", { admins });
        } catch (error) {
            console.error("Erro ao buscar administradores:", error);
            return res.status(500).send("Erro ao buscar administradores");
        }
    }

    async deleteAdmin(req, res) {
        try {
            const id = parseInt(req.params.id, 10);
            if (req.session.user && req.session.user.id === id) {
                return res.redirect("/admin/users");
            }
            const admin = await Users.findByPk(id);
            if (!admin) {
                return res.redirect("/admin/users");
            }
            await admin.destroy();
            return res.redirect("/admin/users");
        } catch (error) {
            console.error("Erro ao deletar administrador:", error);
            return res.status(500).send("Erro ao deletar administrador");
        }
    }

    showRegister(req, res) {
        res.render("admin/login/register.ejs", { error: null });
    }

    async register(req, res) {
        try {
            const { login, password, confirmPassword } = req.body;
            if (!login || !password || !confirmPassword) {
                return res.render("admin/login/register.ejs", { error: "Preencha todos os campos." });
            }

            if (password !== confirmPassword) {
                return res.render("admin/login/register.ejs", { error: "As senhas não coincidem." });
            }

            const existingUser = await Users.findOne({ where: { login } });
            if (existingUser) {
                return res.render("admin/login/register.ejs", { error: "Já existe um administrador com esse usuário." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await Users.create({ login, password: hashedPassword });
            return res.redirect("/admin/login?registered=1");
        } catch (error) {
            console.error(error);
            return res.render("admin/login/register.ejs", { error: "Não foi possível cadastrar o administrador." });
        }
    }

    logout(req, res) {
        req.session.user = undefined;
        res.redirect("/");
    }
}

export default new UsersController();