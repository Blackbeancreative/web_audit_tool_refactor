var express = require('express');
var Audit = require('./bin/audit.js');
var path = require('path');
let pug = require('pug')
var app = express();
const Mail = require('./bin/email.js')
const fs = require('fs');
const pdflib = require('pdf-lib');
const pupper = require('puppeteer')
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req,res){
  res.render('index')
})
app.post('/process_report', async function (req, res) {
  let report = await Audit.auditor(req.body.url);
  const browser = await pupper.launch()
  const webPage = await browser.newPage()
  const pugPage = pug.compileFile('./views/pdf/layout.pug')
  const the_page = pugPage(report)
  const id = Math.random().toString(16).substr(2,5)
  console.log(id)
  fs.writeFile(`./${id}_report.html`, the_page, (callback) => {console.log(callback)})
  await webPage.goto(`file:${path.join(__dirname, `${id}_report.html`)}`, {waitUntil: 'networkidle0'})
  const thePDF = await webPage.pdf({
      preferCSSPageSize: true,
      printBackground: true
    })
    const front = fs.readFileSync('./front.pdf')
    const back = fs.readFileSync('./back.pdf')
    const mergePDF = [front, thePDF, back]
    const finalPDF = await pdflib.PDFDocument.create()
    for (const bytes of mergePDF) {
      const another_temp_pdf_variable = await pdflib.PDFDocument.load(bytes)
      const copiedPages = await finalPDF.copyPages(another_temp_pdf_variable, another_temp_pdf_variable.getPageIndices())
      copiedPages.forEach((page) => {
        finalPDF.addPage(page)
      })
    }
    const buf = await finalPDF.save()
    const the_bytes = Buffer.from(buf)
  
    //const final_pdf = buf.toString('base64')
    Mail.sendMail(req.body.email, req.body.firstname, req.body.url, the_bytes.toString('base64'))
       try {
    //fs.unlinkSync(`${id}_report.html`)
    console.log('success deleting file.')
  } catch (error) {
    console.log(error)
  }
    await browser.close()
  res.render('thanks')
})
module.exports = app;