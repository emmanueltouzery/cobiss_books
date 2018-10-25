import * as nodeMailer from 'nodemailer';
import cheerio from 'cheerio';

import _config from "../config.json";
import puppeteer from 'puppeteer';
import { Vector } from "prelude.ts";

function requireNotNull<T>(a: T|null): T {
    if (a === null) {
        throw "unexpected null!";
    }
    return a;
}

const DEBUG = false;

interface CobissUserInfo {library:string, username:string, password:string, name:string};

// validate the config format
interface Config {
    smtp: {host: string, port: number, secure: boolean, auth: {user:string, pass:string}};
    mailInfo: {from: string, to: string, subject: string};
    cobissCredentials: CobissUserInfo[];
}
const config: Config = _config;

interface Book {}

function sendEmail(booksToReturn: Book[]) {
    const transport = nodeMailer.createTransport(config.smtp);
    transport.sendMail({...config.mailInfo, text: `hello world`});
}

interface BorrowedBook {
    borrowedBy: string;
    returnDate: Date;
    bookTitle: string;
}

async function fetchBooks(user: CobissUserInfo): Promise<BorrowedBook[]> {
    console.log(`Fetching for ${user.name}`);
    const browser = DEBUG ?
        await puppeteer.launch({headless: false}) :
        await puppeteer.launch({args: ['--lang=en-US,en']});
    const page = await browser.newPage();
    await page.goto('https://opac.si.cobiss.net/opac7/user/login/aai/cobiss');
    await page.type('input[placeholder="acronym, title, department, city..."]', user.library);
    await page.waitForSelector('div[data-value="sikvrh"]')
    await page.focus('div[data-value="sikvrh"]')
await page.keyboard.press('Tab');

    await page.type('input#libMemberID', user.username)
    await page.type('input#password1', user.password)

    await page.click('input#wp-submit1');


    await page.waitForSelector("table#myLibs")

    
    const borrowedCount = await page.evaluate(() => parseInt(document.querySelector('table#myLibs tr td:nth-of-type(5) a')!.innerHTML));
    console.log(`${user.name} borrowed ${borrowedCount}`)

    if (borrowedCount === 0) {
        if (!DEBUG) {
            await browser.close();
        }
        return [];
    }
    await page.click("table#myLibs td a")

    await page.waitForSelector("tbody#extLoanStuleBody");
    const rows = await page.evaluate(() => document.querySelector('tbody#extLoanStuleBody')!.innerHTML);

    const rowNodes = cheerio.load("<table>" + rows + "</table>");
    const returnDateStr = rowNodes('tr td:nth-of-type(2)').html()!.trim().substring(0,10);
    const returnDate = new Date(parseInt(returnDateStr.substring(6,10)),
                                parseInt(returnDateStr.substring(3,5))-1,
                                parseInt(returnDateStr.substring(0,2)));
    const bookTitle = requireNotNull(rowNodes('tr td:nth-of-type(3)').html());
    if (!DEBUG) {
        await browser.close();
    }
    return [{borrowedBy: user.name, returnDate, bookTitle}];
}

function printBook(book: BorrowedBook) {
    console.info(`[${book.borrowedBy}] ${book.returnDate} ${book.bookTitle}`);
}

(async () => {
    const books = await Promise.all(config.cobissCredentials.map(fetchBooks))
        .then(b => Vector.ofIterable(b).flatMap(Vector.ofIterable));
    books.forEach(printBook);
})();
