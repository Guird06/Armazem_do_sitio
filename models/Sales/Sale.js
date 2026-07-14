import { Sequelize } from "sequelize";
import connection from "../../database/connection.js";

const Sale = connection.define("sales", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  customerName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  paymentMethod: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  notes: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  items: {
    type: Sequelize.JSON,
    allowNull: false,
  },
  total: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'confirmed', 'cancelled']]
    },
    allowNull: false,
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default Sale;
