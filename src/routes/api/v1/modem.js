import GSM from 'serialport-gsm'
import { Router } from 'express'
import { open } from './functions/modem'


const router = Router()
const modems = []

const getList = async () => {
  let data = await GSM.list().then(a => a.filter(a => a.locationId))
  // console.log(modems.length, data)
  if (modems.length) {
    console.log('get modems')
    // data = modems
    let tempModems = []
    //to add modems
    data.forEach(modem => {
      if (!modems.find(_modem => _modem.comName === modem.comName)) {
        tempModems.push(modem)
      }
    })
    tempModems.forEach(modem => {
      modems.push(modem)
    })

    //to remove modems
    tempModems = []
    modems.forEach(modem => {
      if (!data.find(_modem => _modem.comName === modem.comName)) {
        tempModems.push(modem)
      }
    })
    tempModems.forEach((modem, index) => {
      console.log(index)
      modems.splice(index, 1)
    })
  } else {
    console.log('set modems')

    // modems = data
    let tempModems = []
    data.forEach(modem => {
      if (!modems.find(_modem => _modem.comName === modem.comName)) {
        tempModems.push(modem)
      }
    })
    tempModems.forEach(modem => {
      modems.push(modem)
    })
  }
}

router.get('/', async (req, res) => {
  await getList()
  return res.status(200).json({ payload: modems })
})

router.post('/open/:comName', async (req, res) => {
  await getList()
  let modem = modems.find(modem => modem.comName === req.params.comName)

  let returnFunc = () => {
    let data = {
      comName: modem.comName,
      manufacturer: modem.manufacturer,
      serialNumber: modem.serialNumber,
      pnpId: modem.pnpId,
      locationId: modem.locationId,
      vendorId: modem.vendorId,
      productId: modem.productId,
      connected: modem.serialPort ? modem.serialPort.isOpened : undefined
    }
    res.status(200).json(data)
  }
  if (modem) {
    if (!modem.serialPort) {
      let options = {
        baudRate: 115200,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        xon: false,
        rtscts: false,
        xoff: false,
        xany: false,
        autoDeleteOnReceive: true,
        enableConcatenation: true,
        incomingCallIndication: true,
        incomingSMSIndication: true,
        pin: '',
        // customInitCommand: 'AT^CURC=0',
        // logger: console
      }
      modem.serialPort = GSM.Modem()
      // modem.serialPort.on('open', )

      modem.serialPort.open(req.params.comName, options, () => {
        returnFunc()
      })
      console.log('opening')
      modem.serialPort.on('open', () => open(modem))
      // modem.eve
    } else {
      console.log('not open')
      if (!modem.serialPort.isOpened) {
        console.log('exists, opening again')
        modem.serialPort.open(req.params.comName, options, () => {
          returnFunc()
        })
      } else {
        console.log('exists, already open')
        returnFunc()
      }
    }
  } else {
    res.status(400).json({ error: `${req.params.comName} not found.` })
  }
})

router.post('/close/:comName', async (req, res) => {
  await getList()
  let modem = modems.find(modem => modem.comName === req.params.comName)

  let returnFunc = () => {
    let data = {
      comName: modem.comName,
      manufacturer: modem.manufacturer,
      serialNumber: modem.serialNumber,
      pnpId: modem.pnpId,
      locationId: modem.locationId,
      vendorId: modem.vendorId,
      productId: modem.productId,
      connected: modem.serialPort ? modem.serialPort.isOpened : false
    }
    res.status(200).json(data)
  }

  if (modem) {
    if (modem.serialPort) {
      modem.serialPort.close((err, data) => {
        console.log(`close`)
        modem.serialPort = undefined

        returnFunc()
      })
      console.log('closing')
      if (modem.sqs) {
        modem.sqs.stop()
      }
    } else {
      returnFunc()
    }
  } else {
    res.status(400).json({ error: `${req.params.comName} not found.` })
  }
})

export default router