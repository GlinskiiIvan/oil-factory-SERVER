import express from 'express';
import * as dotenv from 'dotenv';
import * as reportService from './services/report-service.js';
import {sequelize} from './db.js';
import { getReport } from './services/firebird-service.js';

dotenv.config()

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;

const start =  async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        app.listen(PORT, () => {
            console.log('Сервер запущен на порту: ' + PORT);
            reportService.taskMorning();
            reportService.taskEvening(); 
            
            getReport(new Date(2023,4,16,20,0,0))
            
        });
    } catch (e) {
        console.log(e);
    }
};

start();