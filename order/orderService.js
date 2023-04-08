const ws = require("ws");

function roundKdigits(n,k) {
  return Math.round((n * (10 ** k))) / (10 ** k);

}

function getRandomNumberBetween(n1, n2, roundDigit) {
  const randomNumber = Math.random() * (n2 - n1) + n1;
  return Math.round((randomNumber * (10 ** roundDigit))) / (10 ** roundDigit);
}

function generateBidOrders(bidPrice) {
  const MAX_TOTAL_VALUE = 5;
  const NO_ORDERS = 12;
  const MAX_DIFF_PRICE = 0.001;
  const MIN_DIFF_VALUE = 0.000001;
  const randomPrices = [];
  for (let i = 0; i < NO_ORDERS -1; i++) {
    randomPrices.push(getRandomNumberBetween(bidPrice - MIN_DIFF_VALUE, bidPrice - MAX_DIFF_PRICE, 6));
  }

  const totalOrderValue = getRandomNumberBetween(MIN_DIFF_VALUE, MAX_TOTAL_VALUE - MIN_DIFF_VALUE, 6);

  let currentValue = 0;
  const orders = [bidPrice, ...randomPrices].map(price => {
    const orderValue = getRandomNumberBetween(MIN_DIFF_VALUE, totalOrderValue, 6)
    currentValue += orderValue;
    return {size: roundKdigits(orderValue / price, 6), price}
  }).sort((firstOrder, secondOrder) => {
    return secondOrder.price - firstOrder.price
  });

  orders.forEach(order => {
    order.size = roundKdigits(order.size / currentValue * totalOrderValue, 6);
  })

  return {orders, total: totalOrderValue}
}


function generateAskOrders(askPrice) {
  const MAX_TOTAL_SIZE = 150;
  const NO_ORDERS = 12;
  const MAX_DIFF_PRICE = 0.001;
  const MIN_DIFF_VALUE = 0.000001;

  const randomPrices = [];
  for (let i = 0; i < NO_ORDERS -1; i++) {
    randomPrices.push(getRandomNumberBetween(askPrice + MIN_DIFF_VALUE, askPrice + MAX_DIFF_PRICE, 6));
  }

  const totalSize = getRandomNumberBetween(MIN_DIFF_VALUE, MAX_TOTAL_SIZE - MIN_DIFF_VALUE, 6);
  let currentSize = 0;
  let orders = [askPrice, ...randomPrices].map(price => {
    const orderSize = getRandomNumberBetween(MIN_DIFF_VALUE, totalSize / NO_ORDERS, 6);
    currentSize += orderSize;
    return {size: orderSize, price}
  }).sort((first, second) => first.price - second.price);

  orders.forEach(order => {
    order.size = roundKdigits(order.size / currentSize * totalSize, 6);
  })

  return {orders, total: totalSize}
}

function registerOrderHandler(io) {
  const bitFinexSocket = new ws('wss://api-pub.bitfinex.com/ws/2');
  let msg = JSON.stringify({
    event: 'subscribe',
    channel: 'ticker',
    symbol: 'ETHBTC'
  });
  bitFinexSocket.on('open', () => bitFinexSocket.send(msg))

  bitFinexSocket.on('message', (msg) => {
    let data = JSON.parse(msg.toString());
    if (data instanceof Array) {
      const [_, tradeData] = data;
      if (tradeData instanceof Array) {
        const [bidPrice, _, askPrice] = tradeData;

        const bidOrders = generateBidOrders(bidPrice);
        const askOrders = generateAskOrders(askPrice);
        io.emit('order-book-update', {bidOrders, askOrders})
      }
    }
  })
}



module.exports = {registerOrderHandler, generateAskOrders, generateBidOrders}