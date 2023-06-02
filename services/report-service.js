import {CronJob} from 'cron';
import * as firebirdService from './firebird-service.js';

const taskMorning = () => {
    const task = new CronJob(
        '0 0 8 * * *', 
        () => {
            firebirdService.createReport(new Date());
        },
        null,
        false
    );

    task.start();
}

const taskEvening = () => {
    const task = new CronJob(
        '0 0 20 * * *', 
        () => {
            firebirdService.createReport(new Date());
        },
        null,
        false
    );

    task.start();
}

export {taskMorning, taskEvening};