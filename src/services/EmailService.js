const client = require('@sendgrid/mail');
const config = require('../config.js');

class Mail {
    static async sendMail(address, name, url, attachment) {
        client.setApiKey(config.sendgridApi)
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
        client.send(msg)
        .then(() => {
            console.log('[Completed] Report has been emailed');
        }).catch((error)=>{
            console.error(error)
        })
    }
}
module.exports = Mail
