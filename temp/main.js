// main.js
// ------------------------------ Stock Functions ------------------------------
function createStock(tickerId, stockName, price, quantity) {
    return { tickerId, stockName, price, quantity };
}

// ------------------------------ User Functions ------------------------------
function createUser(userId, balance, portfolioId, orderBookId) {
    return {
        userId,
        balance,
        holdAmount: 0, // Default hold amount
        portfolioId,
        orderBookId
    };
}

function updateUserBalance(user, amount) {
    user.balance += amount;
}

function holdUserBalance(user, amount) {
    user.holdAmount += amount;
}

// ------------------------------ Portfolio Functions ------------------------------
function createPortfolio(userId) {
    return {
        userId,
        stocks: []
    };
}

function addStockToPortfolio(portfolio, tickerId, quantity, price) {
    const stock = portfolio.stocks.find(s => s.tickerId === tickerId);
    if (stock) {
        // Adjust price based on average for each trade
        const initialPrice = stock.price;
        const initialQuantity = stock.quantity;
        const totalQuantity = initialQuantity + quantity;
        const avgPrice = ((initialPrice * initialQuantity) + (quantity * price)) / totalQuantity;

        stock.quantity = totalQuantity;
        stock.price = avgPrice;
    } else {
        portfolio.stocks.push({ tickerId, quantity, price, lockedInTrade: 0 });
    }
}

function removeStockFromPortfolio(portfolio, tickerId, quantity) {
    const stock = portfolio.stocks.find(s => s.tickerId === tickerId);
    if (stock) {
        if (stock.quantity < quantity) {
            throw new Error(`Insufficient stock to remove ${tickerId}`);
        }
        stock.quantity -= quantity;
    } else {
        throw new Error(`Stock ${tickerId} not found in portfolio`);
    }
}

function lockStockInPortfolio(portfolio, tickerId, quantity) {
    const stock = portfolio.stocks.find(s => s.tickerId === tickerId);
    if (stock && (stock.quantity - stock.lockedInTrade >= quantity)) {
        stock.lockedInTrade += quantity;
    } else {
        throw new Error(`Insufficient stock to lock for ${tickerId}`);
    }
}

function releaseStockInPortfolio(portfolio, tickerId, quantity) {
    const stock = portfolio.stocks.find(s => s.tickerId === tickerId);
    if (stock && stock.lockedInTrade >= quantity) {
        stock.lockedInTrade -= quantity;
    } else {
        throw new Error(`Insufficient locked stock to release for ${tickerId}`);
    }
}

function getStockFromPortfolio(portfolio, tickerId) {
    return portfolio.stocks.find(s => s.tickerId === tickerId);
}

// ------------------------------ Order Book Functions ------------------------------
function createOrderBook() {
    return { orders: [] };
}

function addOrderToOrderBook(orderBook, orderId, userId, tickerId, price, quantity, type, status) {
    orderBook.orders.push({ orderId, userId, tickerId, price, quantity, type, status });
}

function updateStatusOrderBook(orderBook, orderId, status) {
    const order = orderBook.orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
    } else {
        throw new Error(`Order with ID ${orderId} not found`);
    }
}

function getOrderHistoryFromOrderBook(orderBook, userId) {
    return orderBook.orders.filter(order => order.userId === userId);
}

// ------------------------------ Global Data ------------------------------
const stocks = [];
const users = [];
const portfolios = [];
const orderBook = createOrderBook();

// ------------------------------ Stock Management Functions ------------------------------
function addStock(stockDetails) {
    const { tickerId, stockName, price, quantity } = stockDetails;
    stocks.push(createStock(tickerId, stockName, price, quantity));
}

function addUser(userDetails) {
    const { userId, balance, portfolioId, orderBookId } = userDetails;
    users.push(createUser(userId, balance, portfolioId, orderBookId));
    portfolios.push(createPortfolio(userId));
}

function updateBalance(userDetails) {
    const { userId, balance } = userDetails;
    const user = users.find(u => u.userId === userId);
    if (user) {
        updateUserBalance(user, balance);
    } else {
        console.log(`User with ID ${userId} not found`);
    }
}

// ------------------------------ Order Management Functions ------------------------------
function placeOrder(orderDetails) {
    const { userId, type, tickerId, price, quantity } = orderDetails;

    const user = users.find(u => u.userId === userId);
    if (!user) {
        console.log(`User with ID ${userId} not found`);
        return;
    }

    const stock = stocks.find(s => s.tickerId === tickerId);
    if (!stock || stock.quantity < quantity) {
        console.log(`Stock ${tickerId} does not exist or insufficient quantity available`);
        return;
    }

    if (type === "buy") {
        const totalCost = price * quantity;
        if (user.balance - user.holdAmount < totalCost) {
            console.log(`Insufficient balance: Required: ${totalCost}, Available: ${user.balance - user.holdAmount}`);
            return;
        }

        holdUserBalance(user, totalCost);
        addOrderToOrderBook(orderBook, orderBook.orders.length + 1, userId, tickerId, price, quantity, "buy", "send to exchange");
        addBuyOrder(tickerId, { userId, price, quantity, orderBookId: user.orderBookId });
        console.log(`Buy order placed: ${quantity} of ${tickerId} at ${price}`);
    } else if (type === "sell") {
        const portfolio = portfolios.find(p => p.userId === userId);
        if (!portfolio) {
            console.log(`Portfolio not found for user ${userId}`);
            return;
        }

        const portfolioStock = getStockFromPortfolio(portfolio, tickerId);
        if (!portfolioStock || portfolioStock.quantity - portfolioStock.lockedInTrade < quantity) {
            console.log(`Insufficient stock in portfolio for ${tickerId}`);
            return;
        }

        lockStockInPortfolio(portfolio, tickerId, quantity);
        addOrderToOrderBook(orderBook, orderBook.orders.length + 1, userId, tickerId, price, quantity, "sell", "send to exchange");
        addSellOrder(tickerId, { userId, price, quantity, orderBookId: user.orderBookId });
        console.log(`Sell order placed: ${quantity} of ${tickerId} at ${price}`);
    }
}

// ------------------------------ Portfolio Retrieval Functions ------------------------------
function getPortfolio(userId) {
    const portfolio = portfolios.find(p => p.userId === userId);
    return portfolio ? portfolio : `Portfolio not found for user ${userId}`;
}

function getOrderHistory(userId) {
    return getOrderHistoryFromOrderBook(orderBook, userId);
}

// ------------------------------ Matched Orders Function ------------------------------
function afterMatchedOrders(quantity, price, buyer, seller, buyerBookId, sellerBookId, tickerId) {
    const amount = price * quantity;

    // Update order book statuses
    updateStatusOrderBook(orderBook, buyerBookId, "Done");
    updateStatusOrderBook(orderBook, sellerBookId, "Done");

    // Buyer side
    updateUserBalance(buyer, -amount);
    holdUserBalance(buyer, -amount);
    const buyerPortfolio = portfolios.find(p => p.userId === buyer.userId);
    addStockToPortfolio(buyerPortfolio, tickerId, quantity, price);

    // Seller side
    const sellerPortfolio = portfolios.find(p => p.userId === seller.userId);
    releaseStockInPortfolio(sellerPortfolio, tickerId, quantity);
    removeStockFromPortfolio(sellerPortfolio, tickerId, quantity);
    updateUserBalance(seller, amount);
}

// ------------------------------ Exchange Management ------------------------------
const exchange = {
    tickers: {},
};

// Order queue for each ticker
function initializeTicker(tickerId) {
    if (!exchange.tickers[tickerId]) {
        exchange.tickers[tickerId] = {
            buyOrders: [], // Sort -> price DESC
            sellOrders: [], // Sort -> price ASC
        };
    }
}

// Add Buy Order
function addBuyOrder(tickerId, order) {
    initializeTicker(tickerId);
    let buyOrders = exchange.tickers[tickerId].buyOrders;
    buyOrders.push(order);
    buyOrders.sort((a, b) => b.price - a.price); // Sort buy orders by price DESC
    matchOrders(tickerId);
}

// Add Sell Order
function addSellOrder(tickerId, order) {
    initializeTicker(tickerId);
    let sellOrders = exchange.tickers[tickerId].sellOrders;
    sellOrders.push(order);
    sellOrders.sort((a, b) => a.price - b.price); // Sort sell orders by price ASC
    matchOrders(tickerId);
}

// Match Buy and Sell Orders
function matchOrders(tickerId) {
    let { buyOrders, sellOrders } = exchange.tickers[tickerId];

    while (buyOrders.length > 0 && sellOrders.length > 0) {
        let buyOrder = buyOrders[0];
        let sellOrder = sellOrders[0];

        if (buyOrder.price >= sellOrder.price) {
            // Orders can be matched
            let matchedQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
            console.log(`Matched: ${matchedQuantity} of ${tickerId} at ${sellOrder.price}`);

            afterMatchedOrders(matchedQuantity, sellOrder.price, buyOrder, sellOrder, buyOrder.orderBookId, sellOrder.orderBookId, tickerId);

            // Update quantities
            buyOrder.quantity -= matchedQuantity;
            sellOrder.quantity -= matchedQuantity;

            // Remove orders if fully matched
            if (buyOrder.quantity === 0) {
                buyOrders.shift();
            }
            if (sellOrder.quantity === 0) {
                sellOrders.shift();
            }
        } else {
            break; // No further matches possible
        }
    }
}

