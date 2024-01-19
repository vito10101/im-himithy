import express from 'express'
import basicAuth from "express-basic-auth";
import http from 'node:http'
import { createBareServer } from '@tomphttp/bare-server-node'
import path from 'node:path'
import cors from 'cors'
import config from './config.js'
const __dirname = process.cwd()
const server = http.createServer()
const app = express(server)
const bareServer = createBareServer('/v/')
const PORT = 8080
if (config.passwordProtect) {
  console.log("Password protection is enabled. Username is 'interstellar'.")
  console.log("Password is: " + config.password)
  app.use(basicAuth({
    users: { "interstellar" : password },
    challenge: true
  }))
}
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.static(path.join(__dirname, 'static')))

const routes = [
  { path: '/', file: 'index.html' },
  { path: '/~', file: 'apps.html' },
  { path: '/-', file: 'games.html' },
  { path: '/!', file: 'settings.html' },
  { path: '/0', file: 'tabs.html' },
  { path: '/&', file: 'go.html' },
  { path: '/w', file: 'edu.html' },
]

app.get('/y/*', cors({ origin: false }), async (req, res, next) => {
  try {
    const reqTarget = `https://raw.githubusercontent.com/ypxa/y/main/${req.params[0]}`
    const asset = await fetch(reqTarget)

    if (asset.ok) {
      const data = await asset.arrayBuffer()
      res.end(Buffer.from(data))
    } else {
      next()
    }
  } catch (error) {
    console.error('Error fetching:', error)
    next(error)
  }
})

routes.forEach((route) => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'static', route.file))
  })
})

server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res)
  } else {
    app(req, res)
  }
})

server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head)
  } else {
    socket.end()
  }
})

server.on('listening', () => {
  console.log(`Running at http://localhost:${PORT}`)
})

server.listen({
  port: PORT,
})
