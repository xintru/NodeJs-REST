const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const multer = require('multer')
const uuidv4 = require('uuid/v4')
const graphqlHttp = require('express-graphql')
const fs = require('fs')

const graphqlSchema = require('./graphql/schema')
const graphqlResolver = require('./graphql/resolvers')
const auth = require('./middleware/auth')
const { clearImage } = require('./util/file')

const app = express()

const fileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'images')
  },
  filename: function(req, file, cb) {
    cb(null, uuidv4() + file.originalname)
  },
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

app.use(bodyParser.json())
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
)
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use(auth)

app.put('/post-image', (req, res, next) => {
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided' })
  }
  if (req.body.oldPath) {
    clearImage(req.body.oldPath)
  }
  if (!req.isAuth) {
    const error = new Error('Not authorized')
    throw error
  }
  return res.status(201).json({
    message: 'File stored',
    filePath: req.file.path.replace(/\\/g, '/'),
  })
})

app.use(
  '/graphql',
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err
      }
      const data = err.originalError.data
      const message = err.message || 'An error occured'
      const code = err.originalError.code || 500
      return {
        message,
        status: code,
        data,
      }
    },
  })
)

app.use((error, req, res, next) => {
  console.log(error)
  const status = error.statusCode || 500
  const message = error.message
  const data = error.data
  res.status(status).json({ message, data })
})

mongoose
  .connect(
    'mongodb+srv://xintru:2p3c2635q@cluster0-rx2ra.mongodb.net/messages?authSource=admin&replicaSet=Cluster0-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(res => {
    app.listen(8080)
  })
  .catch(err => console.log(err))
