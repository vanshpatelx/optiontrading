// stockTrading.ts
import { Stock, User, Portfolio, PortfolioStock, Order, OrderBook, OrderExchange, PlaceOrder, AddUser } from '../types/index';

// ------------------------------ Global Data ------------------------------
const stocks: Stock[] = [];
const users: User[] = [];
const portfolios: Portfolio[] = [];
const orderBook: OrderBook = { orders: [] };

// ------------------------------ Stock Functions ------------------------------
export function createStock(tickerId: string, stockName: string, price: number, quantity: number): Stock {
    return { tickerId, stockName, price, quantity };
}

export function addStock(stockDetails: Stock): void {
    stocks.push(stockDetails);
}

// ------------------------------ User Functions ------------------------------
export function createUser(balance: number): User {
    const userId =  (users.length + 1).toString();
    return {
        userId : userId,
        balance,
        holdAmount: 0,
        portfolioId : Number(userId),
        orderBookId : Number(userId)
    };
}

export function updateUserBalance(userId: string, amount: number): void {
    const user: User | undefined = users.find(u => u.userId === userId);
    if (user) {
        user.balance += amount;
    } else {
        console.error(`User with ID ${userId} not found.`);
    }
}
export function getUserBalance(userId: string): number | undefined {
    const user: User | undefined = users.find(u => u.userId === userId);
    if (user) {
        return (user.balance - user.holdAmount);
    } else {
        console.error(`User with ID ${userId} not found.`);
        return undefined; // Return undefined if user is not found
    }
}

export function holdUserBalance(userId: string, amount: number): void {
    const user: User | undefined = users.find(u => u.userId === userId);
    if (user) {
        user.holdAmount += amount;
    } else {
        console.error(`User with ID ${userId} not found.`);
    }
}


export function addUser(balance: number): string {
    const newUser = createUser(balance);
    users.push(newUser);
    
    const newPortfolio = createPortfolio(newUser.userId);
    portfolios.push(newPortfolio);
    return newUser.userId;
}

// ------------------------------ Portfolio Functions ------------------------------
export function createPortfolio(userId: string): Portfolio {
    return {
        userId,
        stocks: [],
    };
}

export function addStockToPortfolio(portfolio: Portfolio, tickerId: string, quantity: number, price: number): void {
    const stock = portfolio.stocks.find(s => s.tickerId === tickerId);
    if (stock) {
        const totalQuantity = stock.quantity + quantity;
        const avgPrice = ((stock.price * stock.quantity) + (price * quantity)) / totalQuantity;

        stock.quantity = totalQuantity;
        stock.price = avgPrice;
    } else {
        portfolio.stocks.push({ tickerId, quantity, price, lockedInTrade: 0 });
    }
}

export function removeStockFromPortfolio(portfolio: Portfolio, tickerId: string, quantity: number): void {
    const stock = portfolio.stocks.find(s => s.tickerId === tickerId);
    if (!stock) {
        throw new Error(`Stock ${tickerId} not found in portfolio`);
    }
    
    if (stock.quantity < quantity) {
        throw new Error(`Insufficient stock to remove ${tickerId}`);
    }
    
    stock.quantity -= quantity;
}

export function lockStockInPortfolio(portfolio: Portfolio, tickerId: string, quantity: number): void {
    const stock = portfolio.stocks.find(s => s.tickerId === tickerId);
    if (!stock || (stock.quantity - stock.lockedInTrade < quantity)) {
        throw new Error(`Insufficient stock to lock for ${tickerId}`);
    }
    
    stock.lockedInTrade += quantity;
}

export function releaseStockInPortfolio(portfolio: Portfolio, tickerId: string, quantity: number): void {
    const stock = portfolio.stocks.find(s => s.tickerId === tickerId);
    if (!stock || stock.lockedInTrade < quantity) {
        throw new Error(`Insufficient locked stock to release for ${tickerId}`);
    }
    
    stock.lockedInTrade -= quantity;
}

export function getStockFromPortfolio(portfolio: Portfolio, tickerId: string): PortfolioStock | undefined {
    return portfolio.stocks.find(s => s.tickerId === tickerId);
}

// ------------------------------ Order Book Functions ------------------------------
export function createOrderBook(): OrderBook {
    return { orders: [] };
}

export function addOrderToOrderBook(orderBook: OrderBook, order: Order): void {
    orderBook.orders.push(order);
}

export function updateStatusOrderBook(orderBook: OrderBook, orderId: number, status: string): void {
    const order = orderBook.orders.find(o => o.orderId === orderId);
    if (!order) {
        throw new Error(`Order with ID ${orderId} not found`);
    }
    
    order.status = status;
}

export function getOrderHistoryFromOrderBook(orderBook: OrderBook, userId: string): Order[] {
    return orderBook.orders.filter(order => order.userId === userId);
}

// ------------------------------ Stock Management Functions ------------------------------
export function updateBalance(userDetails: { userId: string; balance: number }): void {
    const user = users.find(u => u.userId === userDetails.userId);
    if (user) {
        updateUserBalance(user.userId, userDetails.balance);
    } else {
        console.log(`User with ID ${userDetails.userId} not found`);
    }

}

export function placeOrder(orderDetails: PlaceOrder): void {
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

        holdUserBalance(user.userId, totalCost);
        addOrderToOrderBook(orderBook, { orderId: orderBook.orders.length + 1, userId, tickerId, price, quantity, type, status: "send to exchange" });
        const order: OrderExchange = {
            userId : user.userId,
            price : price,
            quantity : quantity,
            orderId : user.orderBookId
        };
        addBuyOrder(tickerId, order);
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
        addOrderToOrderBook(orderBook, { orderId: orderBook.orders.length + 1, userId, tickerId, price, quantity, type, status: "send to exchange" });
        const order: OrderExchange = {
            userId : user.userId,
            price : price,
            quantity : quantity,
            orderId : user.orderBookId
        };
        addSellOrder(tickerId, order);
        console.log(`Sell order placed: ${quantity} of ${tickerId} at ${price}`);
    }
}

// ------------------------------ Portfolio Retrieval Functions ------------------------------
export function getPortfolio(userId: string): Portfolio | string {
    const portfolio = portfolios.find(p => p.userId === userId);
    return portfolio ? portfolio : `Portfolio not found for user ${userId}`;
}

export function getOrderHistory(userId: string): Order[] {
    return getOrderHistoryFromOrderBook(orderBook, userId);
}

// ------------------------------ Matched Orders Function ------------------------------
export function afterMatchedOrders(quantity: number, price: number, buyer: OrderExchange, seller: OrderExchange, buyerBookId: number, sellerBookId: number, tickerId: string): void {
    const amount = price * quantity;

    // Update order book statuses
    updateStatusOrderBook(orderBook, buyerBookId, "Done");
    updateStatusOrderBook(orderBook, sellerBookId, "Done");

    // Buyer side
    updateUserBalance(buyer.userId, -amount);
    holdUserBalance(buyer.userId, -amount);
    const buyerPortfolio = portfolios.find(p => p.userId === buyer.userId);
    if (buyerPortfolio) {
        addStockToPortfolio(buyerPortfolio, tickerId, quantity, price);
    }

    // Seller side
    updateUserBalance(seller.userId, amount);
    const sellerPortfolio = portfolios.find(p => p.userId === seller.userId);
    if (sellerPortfolio) {
        releaseStockInPortfolio(sellerPortfolio, tickerId, quantity);
        removeStockFromPortfolio(sellerPortfolio, tickerId, quantity);
    }
}

// ------------------------------ Exchange Management ------------------------------
const exchange: { tickers: { [key: string]: { buyOrders: OrderExchange[]; sellOrders: OrderExchange[] } } } = {
    tickers: {},
};

// Order queue for each ticker
function initializeTicker(tickerId: string): void {
    if (!exchange.tickers[tickerId]) {
        exchange.tickers[tickerId] = {
            buyOrders: [],
            sellOrders: [],
        };
    }
}

// Add Buy Order
export function addBuyOrder(tickerId: string, order: OrderExchange): void {
    initializeTicker(tickerId);
    const buyOrders = exchange.tickers[tickerId].buyOrders;
    buyOrders.push(order);
    buyOrders.sort((a, b) => b.price - a.price); // Sort buy orders by price DESC
    matchOrders(tickerId);
}

// Add Sell Order
export function addSellOrder(tickerId: string, order: OrderExchange): void {
    initializeTicker(tickerId);
    const sellOrders = exchange.tickers[tickerId].sellOrders;
    sellOrders.push(order);
    sellOrders.sort((a, b) => a.price - b.price); // Sort sell orders by price ASC
    matchOrders(tickerId);
}


// Match Buy and Sell Orders
function matchOrders(tickerId: string): void {
    const { buyOrders, sellOrders } = exchange.tickers[tickerId];

    while (buyOrders.length > 0 && sellOrders.length > 0) {
        let buyOrder = buyOrders[0];
        let sellOrder = sellOrders[0];

        if (buyOrder.price >= sellOrder.price) {
            // Orders can be matched
            let matchedQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
            console.log(`Matched: ${matchedQuantity} of ${tickerId} at ${sellOrder.price}`);

            afterMatchedOrders(matchedQuantity, sellOrder.price, buyOrder, sellOrder, buyOrder.orderId, sellOrder.orderId, tickerId);

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
