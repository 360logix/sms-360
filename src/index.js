import 'dotenv/config'
import cors from 'cors'
import bodyParser from 'body-parser'
import express from 'express'
import api from './routes'

const app = express()

// Application-Level Middleware

app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
Object.keys(api).forEach(key => {
  app.use(`/api/${key}`, api[key])
})

// Start
app.listen(process.env.PORT, () =>
  console.log(`${process.env.TITLE} is listening on port ${process.env.PORT}!`),
)