import express from "express";
import Users from "../models/Admin/Users.js";
import adminAuth from "../middlewares/adminAuth.js";

const router = express.Router();

router.get("/admin/login", (req, res) => {
  res.render("admin/login/login.ejs");
});

router.post("/admin/logar",(req,res)=>{
    var login = req.body.login
    var password = req.body.password

    Users.findOne({where:{login:login}}).then(user =>{
        if(user != undefined){
            var correct = password == user.password
            // Verifica se a senha está correta
            if(correct){
                req.session.user = {
                    id: user.id,
                    email: user.email
                }
                res.redirect("/admin/produtos")  
            }else{
                res.redirect("/admin/login")
            }
        }else{
            res.redirect("/admin/login")
        }
    })
});

router.get("/logout",adminAuth,(req,res)=>{
    req.session.user = undefined
    res.redirect("/")
})

export default router;