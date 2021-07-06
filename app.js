const express = require('express'),
Audit = require('./bin/audit.js'),
path = require('path'),
pug = require('pug'),
app = express(),
Mail = require('./bin/email.js'),
fs = require('fs'),
pdflib = require('pdf-lib'),
pupper = require('puppeteer')


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', function(req,res){
  res.render('index')
})
app.post('/process_report', async function (req, res) {
  console.log('starting processing report');
  res.render('thanks')
  let report = await Audit.auditor(req.body.url) //generate audit. includes Lighthouse and Pa11y
  console.log(report);
  const browser = await pupper.launch({headless: headless, devtools: true, args: ['--disable-web-security', '--disable-features=IsolateOrigins', ' --disable-site-isolation-trials']}) //begin generating PDF with puppeteer.
  const webPage = await browser.newPage()
  const pugPage = pug.compileFile('./views/pdf/layout.pug')
  const the_page = pugPage(report)
  const id = Math.random().toString(16).substr(2,5) //generate random identifier for temp HTML file
  fs.writeFile(`./${id}_report.html`, the_page, (callback) => {console.log(callback)})
  console.log('calling synchronous create file');
  await webPage.goto(`file:${path.join(__dirname, `${id}_report.html`)}`, {waitUntil: 'networkidle0'}) //open local file in browser
  const thePDF = await webPage.pdf({
      preferCSSPageSize: true,
      printBackground: true
    })
    const front = fs.readFileSync('./front.pdf') //load front and rear covers
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

    console.log('sending email');
  
    Mail.sendMail(req.body.email, req.body.firstname, req.body.url, the_bytes.toString('base64'))
       try {
    //uncomment this to stop retaining HTML files on POST action. This is for debugging/inspecting template errors.
    //fs.unlinkSync(`${id}_report.html`)
    console.log('success deleting file.')
  } catch (error) {
    console.log(error)
  }
    await browser.close()
})
module.exports = app