import * as fb from 'firebird';
import * as windows1251 from 'windows-1251';
import {ProductionReport} from '../models/models.js';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { Readable } from 'stream';
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs';

XLSX.set_fs(fs); /* load 'fs' for readFile and writeFile support */
XLSX.stream.set_readable(Readable); /* load 'stream' for stream support */
XLSX.set_cptable(cpexcel); /* load the codepage support library for extended support with older formats  */

const getDates = (dateFull) => {
    let date = '';
    let dateStart = '';
    let dateEnd = '';

    if(dateFull.getHours() === 8) {
        date = `${("0" + (dateFull.getMonth() + 1)).slice(-2)}.${dateFull.getFullYear()}`;
        dateStart = `${("0" + (dateFull.getDate())).slice(-2) - 1}.${date} 20:00:00`;
        dateEnd = `${("0" + (dateFull.getDate())).slice(-2)}.${date} 8:00:00`;
    }
    if(dateFull.getHours() === 20) {
        date = `${("0" + (dateFull.getDate())).slice(-2)}.${("0" + (dateFull.getMonth() + 1)).slice(-2)}.${dateFull.getFullYear()}`;
        dateStart = `${date} 08:00:00`;
        dateEnd = `${date} 20:00:00`;
    }

    return {dateStart, dateEnd};
}

const sendQuery = (con, query) => {
    const response = con.querySync(query);
    const rows = response.fetchSync('all', true);
    con.commitSync();

    return rows;
}

const createReport = (uniqueProductRows, allProductDayeRows, date) => {
    const resultData = [];

    uniqueProductRows.forEach(async (item) => {
        const result = [];
        let mass = 0;
        let reportData = {};

        allProductDayeRows.forEach((data) => {            
            if(windows1251.decode(data.PRODUCT) === windows1251.decode(item.PRODUCT)) {
                result.push(data);
            }
        });
        
        console.log(windows1251.decode(item.PRODUCT), result.length);

        if(result.length === 0) {
            const products = await ProductionReport.findAll({where: {product: windows1251.decode(item.PRODUCT)}, order: [['date', 'ASC']]});

            if(products.length === 0) {
                reportData = {
                    product: windows1251.decode(item.PRODUCT),
                    date,
                    mass: 0,
                    count_c: 0
                };
            } else {
                reportData = {
                    product: windows1251.decode(item.PRODUCT),
                    date,
                    mass: 0,
                    count_c: products[products.length - 1].count_c
                };
            }
        }

        if(result.length === 1) {
            const products = await ProductionReport.findAll({where: {product: windows1251.decode(item.PRODUCT)}, order: [['date', 'ASC']]});
                
            products ? mass = result[0].COUNT_C - products[products.length - 1].count_c : result[0].COUNT_C;

            if(products) {
                const dif = result[0].COUNT_C - products[products.length - 1].count_c;

                if(dif > 0) {
                    mass = dif;
                } else {
                    mass = result[0].COUNT_C;
                }
            }

            reportData = {
                product: windows1251.decode(item.PRODUCT),
                date,
                mass,
                count_c: result[0].COUNT_C
            };
        }
        if(result.length > 1) {
            mass = result[result.length - 1].COUNT_C - result[0].COUNT_C;
            reportData = {
                product: windows1251.decode(item.PRODUCT),
                date,
                mass,
                count_c: result[result.length - 1].COUNT_C
            };            
        }

        // ProductionReport.create(reportData);
        resultData.push(reportData);

        console.log('mass', mass);
    });

    return resultData;
}

const createXlsxReport = (data) => {
    const workbook = XLSX.utils.book_new(); 
    const worksheet = XLSX.utils.json_to_sheet(data); 
    XLSX.utils.book_append_sheet(workbook, worksheet, "Отчет произведенной продукции");
    XLSX.utils.sheet_add_aoa(worksheet, [["Продукт", "Дата/Время", "Масса(кг)", "Накопленный счетчик"]], { origin: "A1" });
    XLSX.writeFile(workbook, "test.xlsx");
}

const getReport = async (dateFull) => {
    const con = await fb.createConnection({
        lc_ctype: 'WIN1251'
    });
    con.connectSync(process.env.FIREBIRD_DB, process.env.FIREBIRD_DB_USER, process.env.FIREBIRD_DB_PASSWORD, '');

    const {dateStart, dateEnd} = getDates(dateFull);
    const date = new Date(dateFull.getFullYear(), dateFull.getMonth(), dateFull.getDate(), dateFull.getHours(), 0, 0);

    const uniqueProductRows  = sendQuery(con, `select distinct table_data.product from table_data`);
    const allProductDayeRows = sendQuery(con, `select * from table_data where table_data.datetimef > '${dateStart}' and table_data.datetimef < '${dateEnd}' ORDER BY table_data.datetimef ASC`);

    allProductDayeRows.sort((a, b) => {
        return windows1251.decode(a.PRODUCT).localeCompare(windows1251.decode(b.PRODUCT)) || a.COUNT_C - b.COUNT_C || a.DATETIMEF < b.DATETIMEF;
    });

    const resultData = createReport(uniqueProductRows, allProductDayeRows, date);

    createXlsxReport(resultData);
};

export {getReport};