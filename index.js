const express = require('express');
const path = require("path");
const app = express();
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require('cors')

const httpServer = createServer(app);
const {registerOrderHandler} = require("./order/orderService");
const {OrderController} = require("./order/OrderController");
app.use(cors())

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"]
  }
});

io.on('connection', (socket) => {
  console.log('user connect');
})

app.use(express.static('build'));
app.use('/api/ticker', OrderController)

app.use('/', (req, res) => {
  return res.sendFile(path.join(__dirname + '/build/index.html'));
})


httpServer.listen(5000, () => {
  console.log(`server running on port 5000`);
  registerOrderHandler(io)
})
