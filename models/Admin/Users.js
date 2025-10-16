import { Sequelize } from "sequelize";
import connection from "../../database/connection.js";

const Users = connection.define("users",{
    login:{
        type: Sequelize.STRING,
        allowNull:false
    },
    password:{
        type:Sequelize.STRING,
        allowNull:false
    }
})








export default Users;
