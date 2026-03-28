const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const User = require('../models/User')
const { badRequest, unauthorized } = require('../utils/httpErrors')

const authRouter = express.Router()

function signToken(userId) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('Missing JWT_SECRET in environment')
  return jwt.sign({}, secret, { subject: String(userId), expiresIn: '7d' })
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      phone: z.string().min(8).optional(),
      email: z.string().email(),
      password: z.string().min(6),
    })
    const body = schema.parse(req.body)

    const exists = await User.findOne({ email: body.email.toLowerCase() })
    if (exists) throw badRequest('Email already registered')

    const passwordHash = await bcrypt.hash(body.password, 10)
    const user = await User.create({
      name: body.name,
      phone: body.phone,
      email: body.email.toLowerCase(),
      passwordHash,
    })

    const token = signToken(user._id)
    res.json({ token })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })
    const body = schema.parse(req.body)

    const user = await User.findOne({ email: body.email.toLowerCase() })
    if (!user) throw unauthorized('Invalid email or password')

    const ok = await bcrypt.compare(body.password, user.passwordHash)
    if (!ok) throw unauthorized('Invalid email or password')

    const token = signToken(user._id)
    res.json({ token })
  } catch (err) {
    next(err)
  }
})

module.exports = { authRouter }

