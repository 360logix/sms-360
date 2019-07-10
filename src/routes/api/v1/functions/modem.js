import ConsumeData from 'aws_sqs_service'

export const open = (modem) => {
  let serialPort = modem.serialPort
  serialPort.initializeModem((err, msg) => {
    console.log('initialize msg:', err, msg)
    serialPort.setModemMode((err, msg) => {
      console.log('set pdu msg:', err, msg)

      serialPort.on('onNewMessage', data => {
        console.log('onNewMessage', data)
      })
    }, 'PDU')
    serialPort.deleteAllSimMessages(function (response) {
      console.log(response)
    })

    //set sqs
    if (!modem.sqs) {
      modem.sqs = ConsumeData.initialize({
        queueUrl: process.env.QUEUE_URL,
        batchSize: 5,
        visibilityTimeout: 15,
        attributeNames: ['All'],
        messageAttributeNames: ['All'],
        handleMessage: (message, done) => {
          try {
            message.dateSent = new Date(message.MessageAttributes.timeStampSent.StringValue)
          } catch (err) { }
          // console.log(message)

          let number = message.MessageAttributes.to.StringValue
          if (number.substring(0, 1) === '0') {
            number = `+63${number.substring(1, number.length)}`
          }

          serialPort.sendSMS(number, message.Body, Boolean(Number(message.MessageAttributes.alert.StringValue)), response => {
            console.log('message status', response)
            modem.sqs.deleteSQSMessage(message.ReceiptHandle, sqsData => {
              console.log('Delete sqs message')
            })
          })
          done()
        },
      })
      modem.sqs.start()
    }
  })
}