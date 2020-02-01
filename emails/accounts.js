const sgMail = require('@sendgrid/mail')
const sendgridAPIKey = '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'
sgMail.setApiKey(sendgridAPIKey)

const sendMailToAuthority = (recepient,sub,msg,content,contType) => {
console.info('New Mail to send to : '+ recepient)
sgMail.send({
    to: recepient,
    from: 'sdbans@gmail.com',
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