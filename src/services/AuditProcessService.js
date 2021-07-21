const AuditService = require('./AuditService.js');
const MailService = require('./EmailService.js');
const fs = require('fs').promises;
const pdflib = require('pdf-lib');
const pupper = require('puppeteer');
const pug = require('pug');
const path = require('path');

const closeChrome = async (browserInstance) => {
    /*
    * Workaround to an existing issue with Chromium/Puppeteer on some Machines/OS's
    * Reference: https://www.gitmemory.com/issue/puppeteer/puppeteer/6563/739149056
    */
    const pages = await browserInstance.pages(); 
    await Promise.all(pages.map(page =>page.close())); 
    await browserInstance.close();
  }

const use = async (pugViews, url, firstName, lastName, emailAddress) => {

    if (!url)
        throw Error("Invalid url!");

    if (!firstName || !lastName)
        throw Error("Invalid first and last name!");

    if (!emailAddress)
        throw Error("Invalid email address!");

    // Render Thanks
    const generateId = Math.random().toString(16).substr(2,5);

    console.log(`[Report] Starting report processing. (url: ${url}`);
    // Starting Pre-requisites

    console.log('[Report] Generating Auditor');
    const auditReport = await AuditService.auditor(url);
    if (auditReport) {
        console.log('[Report] Audit report came back');

        // Compile PUG File to PDF
        console.log(`[Report] Creating Audit Report by Compiling Templates to Id: ${generateId}`);
        const layoutPUG = pug.compileFile(path.join(pugViews, 'pdf/layout.pug'));
        const useReportFile = layoutPUG(auditReport);
        const writeAuditFile = await fs.writeFile(`./reports/${generateId}.html`, useReportFile);
        if (writeAuditFile)
        console.log(`Audit file has been written to ${generateId}.html`);
    }

    // Puppeteer Print with PDF
    console.log('[Report] Starting Puppeteer');
    const browser = await pupper.launch({ headless: true });
    if (browser) {
        console.log(`[Report] Puppeteer browser launched, generating pdf from Audit with Id: ${generateId}`);
        console.log(`[Report] File location should be: ${path.join(__dirname, `../../reports/${generateId}.html`)}`);
        const newTab = await browser.newPage();
        newTab.setDefaultNavigationTimeout(0); 
        if (newTab) {
        console.log('[Report] Using tab, printing PDF for report HTML');
        await newTab.goto(`file:${path.join(__dirname, `../../reports/${generateId}.html`)}`, {waitUntil: 'networkidle0'});
        const printPDF = await newTab.pdf({ preferCSSPageSize: true, printBackground: true });
        if (printPDF) {
            await closeChrome(browser).then(() => console.log('[Report] Browser closed!'));

            console.log('[Report] PDF created, closing browser and merging files now');

            const pdfFront = await fs.readFile(path.join(__dirname, '../assets/front.pdf'));
            const pdfBack = await fs.readFile(path.join(__dirname, '../assets/back.pdf'));
            
            if (pdfFront && pdfBack && printPDF) {
            const pdfBytes = [pdfFront, printPDF, pdfBack];
            const pdfCreate = await pdflib.PDFDocument.create();
            if (pdfCreate) {
                for (const bytes of pdfBytes) {
                    const another_temp_pdf_variable = await pdflib.PDFDocument.load(bytes)
                    const copiedPages = await pdfCreate.copyPages(another_temp_pdf_variable, another_temp_pdf_variable.getPageIndices())
                    copiedPages.forEach((page) => pdfCreate.addPage(page));
                }

                const saveBuffer = await pdfCreate.save();
                if (saveBuffer) {
                    const useBytes = Buffer.from(saveBuffer);
                    console.log(`[Report] COMPLETED! Sending email to ${url}!`)
                    MailService.sendMail(emailAddress, firstName, url, useBytes.toString('base64'))
                    return { message: "Your report has successfully been sent!" };
                } else 
                    console.log('[Report] Do not have buffer return from final PDF!');
            } else 
                console.log('[Report] Unable to call PDFDocument Creator!');
            } else 
            console.log('[Report] Missing PDF Front, Back or Report!');
        } else 
            await closeChrome(browser).then(() => console.log('[Report] Browser closed due to error!'));
        } else 
        console.log('[Report] New tab could not be created for page');

    } else
        console.log('[Report] Failed to open Puppeteer browser!');
}

module.exports = { use };