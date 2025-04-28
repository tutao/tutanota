// cors-proxy.js
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { createProxyMiddleware } = require('http-proxy-middleware')

const app = express()
const PORT = 4000
const TARGET = 'https://app.tuta.com' // Tutanota real server

app.use(cors())
app.use(morgan('dev'))

app.use(
  '/',
  createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    secure: false,
    onProxyReq(proxyReq, req, res) {
      proxyReq.setHeader('origin', TARGET)
    }
  })
)

app.listen(PORT, () => {
  console.log(`CORS Proxy running on http://localhost:${PORT}`)
})
