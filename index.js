const Audit = require('./audit.js'),
writePDF = require('./writePDF.js'),
fs = require('fs')
const getReport = async (website) => {
    const data = await Audit.auditor(website),
        options = { format: 'Letter' },
        payload = await JSON.parse(JSON.stringify(data)),
        doc = fs.readFileSync('./template.ejs').toString(),
        template = await writePDF.generateTemplate(doc, payload, options),
        PDF = await writePDF.parseTemplate(template)
    return PDF
}

getReport('https://greenbean.marketing')