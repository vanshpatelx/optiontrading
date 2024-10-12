// types.ts

// Stock Type
export interface Stock {
    tickerId: string;
    stockName: string;
    price: number;
    quantity: number;
}

// User Type
export interface User {
    userId: string;
    balance: number;
    holdAmount: number;
    portfolioId: number;
    orderBookId: number;
}

// Portfolio Type
export interface Portfolio {
    userId: string;
    stocks: PortfolioStock[];
}

export interface PortfolioStock {
    tickerId: string;
    quantity: number;
    price: number;
    lockedInTrade: number;
}

// Order Type
export interface Order {
    orderId: number;
    userId: string;
    tickerId: string;
    price: number;
    quantity: number;
    type: 'buy' | 'sell';
    status: string;
}

export interface OrderExchange {
    userId: string;
    price: number;
    quantity: number;
    orderId : number;
}

// OrderBook Type
export interface OrderBook {
    orders: Order[];
}


export interface PlaceOrder{
    userId : string,
    type : 'buy' | 'sell',
    tickerId : string,
    price : number,
    quantity : number
}

export interface AddUser {
    userId: string;
    balance: number;
}