import * as nodeMailer from 'nodemailer';

import _config from "../config.json";
import puppeteer from 'puppeteer';
import { Vector } from "prelude.ts";

const DEBUG = false;
const WARN_IF_MUST_RETURN_DAYS = 7;

interface CobissUserInfo {library:string, username:string, password:string, name:string};

// validate the config format
interface Config {
    smtp: {host: string, port: number, secure: boolean, auth: {user:string, pass:string}};
    mailInfo: {from: string, to: string, subject: string};
    cobissCredentials: CobissUserInfo[];
}
const config: Config = _config;

function sendEmailWithText(text: string) {
    const transport = nodeMailer.createTransport(config.smtp);
    transport.sendMail(
        {...config.mailInfo, text});
}

function sendEmail(booksToReturn: Vector<BorrowedBook>, allBooks: Vector<BorrowedBook>) {
    sendEmailWithText(`Must return:\n${booksToReturn.map(bookToString).mkString("\n")}.\n` +
                      `\nAll books:\n${allBooks.map(bookToString).mkString("\n")}`);
}

interface BorrowedBook {
    borrowedBy: string;
    returnDate: Date;
    bookTitle: string;
}

async function fetchBooks(user: CobissUserInfo): Promise<Vector<BorrowedBook>> {
    console.log(`Fetching for ${user.name}`);
    const browser = DEBUG ?
        await puppeteer.launch({headless: false}) :
        await puppeteer.launch({args: ['--lang=en-US,en']});
    try {
        const page = await browser.newPage();
        await page.goto('https://opac.si.cobiss.net/opac7/user/login/aai/cobiss');
        await page.type('input[placeholder="acronym, title, department, city..."]', user.library);
        await page.waitForSelector(`div[data-value="${user.library.toLowerCase()}"]`)
        await page.focus(`div[data-value="${user.library.toLowerCase()}"]`)
        await page.keyboard.press('Tab');

        await page.type('input#libMemberID', user.username)
        await page.type('input#password1', user.password)

        await page.click('input#wp-submit1');

        await page.waitForSelector("table#myLibs")

        const borrowedCount = await page.evaluate(() => parseInt(document.querySelector('table#myLibs tr td:nth-of-type(5) a')!.innerHTML));
        console.log(`${user.name} borrowed ${borrowedCount}`)

        if (borrowedCount === 0) {
            return Vector.empty();
        }
        await page.click("table#myLibs td a")

        await page.waitForSelector("tbody#extLoanStuleBody");
        const returnDateStrs: string[] =
            await page.evaluate(() => [...document.querySelectorAll('tbody#extLoanStuleBody tr td:nth-of-type(2)')]
                                .map(elem => elem.innerHTML.trim().substring(0,10)));

        const returnDates =
            Vector.ofIterable(returnDateStrs)
            .map(returnDateStr => new Date(
                parseInt(returnDateStr.substring(6,10)),
                parseInt(returnDateStr.substring(3,5))-1,
                parseInt(returnDateStr.substring(0,2))));

        const bookTitles: string[] =
            await page.evaluate(() => [...document.querySelectorAll('tbody#extLoanStuleBody tr td:nth-of-type(3)')]
                                .map(elem => elem.innerHTML.trim()));
        return returnDates.zip(bookTitles)
            .map(([returnDate,bookTitle]) => ({borrowedBy: user.name, returnDate, bookTitle}));
    } finally {
        if (!DEBUG) {
            await browser.close();
        }
    }
}

function bookToString(book: BorrowedBook) {
    return `[${book.borrowedBy}] ${book.returnDate.toLocaleDateString()} ${book.bookTitle}`;
}

(async () => {
    try {
        console.log(new Date());
        const books = await Promise.all(config.cobissCredentials.map(fetchBooks))
            .then(b => Vector.ofIterable(b).flatMap(Vector.ofIterable));
        books.map(bookToString).map(console.info);
        const booksToReturn = books.filter(b => (b.returnDate.getTime() - new Date().getTime() <= WARN_IF_MUST_RETURN_DAYS*24*3600*1000));
        if (booksToReturn.length() > 0) {
            console.log("oops must return soon!")
            sendEmail(booksToReturn, books);
        }
    } catch (ex) {
        sendEmailWithText("Error: " + ex);
    }
})();
