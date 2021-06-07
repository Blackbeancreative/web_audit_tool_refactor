const Audit = require('./audit.js')
const writePDF = require('./writePDF.js')
const fsPromises = require('fs').promises
const fs = require('fs')
const getReport = async (website) => {
    const data = await Audit.auditor(website)
    console.log(data)
    const options = { format: 'Letter' }
    const payload = await JSON.parse(JSON.stringify(data))
    const doc = fs.readFileSync('./template.ejs').toString()
    const template = await writePDF.generateTemplate(doc, payload, options)
    const PDF = await writePDF.parseTemplate(template)
    return PDF
}

getReport('https://greenbean.marketing')