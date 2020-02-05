const { validationResult } = require('express-validator')
const Post = require('../models/post')

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: '1',
        title: 'First post',
        content: 'This is first post!',
        imageUrl: '/images/porech.jpg',
        creator: {
          name: 'Alex',
        },
        createdAt: new Date(),
      },
    ],
  })
}

exports.postPost = (req, res, next) => {
  const errors = validationResult(res)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.')
    error.statusCode = 422
    throw error
  }
  const title = req.body.title
  const content = req.body.content
  const post = new Post({
    title: title,
    content: content,
    imageUrl: '/images/porech.jpg',
    creator: {
      name: 'Alex',
    },
  })
  post
    .save()
    .then(result => {
      console.log(result)
      res.status(201).json({
        message: 'Post created!',
        post: result,
      })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500
      }
      next(err)
    })
}
