const sgMail = require('@sendgrid/mail')
const sendgridAPIKey = 'XXXX' // replace XXXXX with sendgrid registered apiKey 
sgMail.setApiKey(sendgridAPIKey)

const sendMailToAuthority = (sender,recepient,sub,msg,content,contType) => {
console.info('New Mail for : '+ recepient)
sgMail.send({
    to: recepient,
    from: sender,
    subject: sub,
    text: msg,
    attachments: [{
        content: content,
        filename: "Captured Image",
        type: contType,
        disposition: "attachment"
    }]
}).catch(err => console.log(err))
}

module.exports = {
    sendMailToAuthority
}