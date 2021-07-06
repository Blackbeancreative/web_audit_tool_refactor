const client = require('@sendgrid/mail')
class Mail {
static async sendMail(address, name, url, attachment) {
  client.setApiKey('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')
  let clean_url = url.replace(/\/$/, "");
  clean_url = url.match(/https?:\/\/(.*)/)
  const msg = {
    to: address,
    from: 'info@blackbean.marketing',
    subject: `Hey ${name}! Your report for ${clean_url[1]}`,
    text: "Thanks for downloading our report, you cool cat you!",
    attachments: [
        {
            content: attachment,
            filename: `${clean_url[1]}_audit.pdf`,
            disposition: "attachment"
        }
    ]
  }
  client.send(msg).then(() => {
    console.log('email sent')
  }).catch((error)=>{
    console.error(error)
  })
}
}
module.exports = Mail
