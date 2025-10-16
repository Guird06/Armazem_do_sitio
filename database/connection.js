import { Sequelize } from "sequelize";

const connection = new Sequelize("armazemsitio", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
  timezone: "-03:00",
});

export default connection; 
