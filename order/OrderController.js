const {generateBidOrders, generateAskOrders} = require("./orderService");
const axios = require("axios");
const router = require('express').Router();

router.get('/', async (req, res) => {
  try {
    const [bidPrice, _ , askPrice] = await axios.get('https://api-pub.bitfinex.com/v2/ticker/tETHBTC').then(res=> res.data)

    const bidOrders = generateBidOrders(bidPrice);
    const askOrders = generateAskOrders(askPrice);
    res.status(200).json({
      bidOrders, askOrders
    })
  } catch (e) {
    res.status(500).json({message: 'fail to get initial data'});
  }

})

module.exports = {OrderController: router}