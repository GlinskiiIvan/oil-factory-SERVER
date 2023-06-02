import {sequelize} from '../db.js';
import {DataTypes} from 'sequelize';

const ProductionReport = sequelize.define('productionReport', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    product: {type: DataTypes.STRING, allowNull: false},
    date: {type: DataTypes.DATE, allowNull: false},
    mass: {type: DataTypes.FLOAT, allowNull: false},
    count_c: {type: DataTypes.FLOAT, allowNull: false},
});

export {ProductionReport};