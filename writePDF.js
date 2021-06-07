const ejs = require("ejs"),
    pdf = require("html-pdf")

class WritePDF {
    static async generateTemplate(template, data, options) {
        const doc =  ejs.render(template, data, options)
        return doc
        }
    static async parseTemplate(doc) {
        pdf.create(doc).toBuffer(function(err, buffer){
            const base64Doc =  buffer.toString('base64')
            console.log(base64Doc)
            return base64Doc
        })

    }
    static async deliverPDF(base64Doc) {
        console.log(base64Doc)
    }

}
module.exports = WritePDF