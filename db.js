import {Sequelize} from "sequelize";

export const sequelize =  new Sequelize(
    'oil-factory',
    'postgres',
    'root',
    {
        dialect: 'postgres',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
    }
);