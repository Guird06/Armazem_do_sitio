import { Sequelize } from "sequelize";
import connection from "../../database/connection.js";

const Produto = connection.define("produtos", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },

  title: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  price: {
    type: Sequelize.DECIMAL(10, 2), 
    allowNull: false,
    validate: {
      isDecimal: {
        msg: "O preço deve ser um número decimal válido",
      },
      min: {
        args: [0],
        msg: "O preço não pode ser negativo",
      },
    },
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  category: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  stock: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  image: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});



export default Produto;
