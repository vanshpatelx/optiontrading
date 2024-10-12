// server.ts
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import {
    addStock,
    addUser,
    placeOrder,
    getPortfolio,
    getOrderHistory,
    updateBalance,
    getUserBalance,
} from './controllers/stockTrading';

import {
    PlaceOrder
} from './types/index';

const app = express();
const port = 3000;

app.use(bodyParser.json());

// ------------------------------ Endpoints ------------------------------

// 1. POST /orders - Place an order
app.post('/orders', (req: Request, res: Response) => {
    const { userId, type, tickerId, price, quantity } = req.body;
    
    try {
        const order: PlaceOrder = {
            userId: userId,
            type: type,
            tickerId: tickerId,
            price: price,
            quantity: quantity
        };
        placeOrder(order);
        res.status(201).send('Order placed successfully');
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
        res.status(400).send(errorMessage);
    }
});


// 2. GET /orders/history/:userId - Get order history for a user
app.get('/orders/history/:userId', (req: Request, res: Response) => {
    const userId = req.params.userId;
    const orderHistory = getOrderHistory(userId);
    res.json(orderHistory);
});

// 3. GET /portfolios/:userId - Get user portfolio
app.get('/portfolios/:userId', (req: Request, res: Response) => {
    const userId = req.params.userId;
    const portfolio = getPortfolio(userId);
    res.json(portfolio);
});

// 4. POST /stocks - Add a stock
app.post('/stocks', (req: Request, res: Response) => {
    const { tickerId, stockName, price, quantity } = req.body;
    try {
        addStock({ tickerId, stockName, price, quantity });
        res.status(201).send(`Stock added successfully - ${tickerId}`);
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
        res.status(400).send(errorMessage);
    }
});

// 5. POST /users - Add a user
app.post('/users', (req: Request, res: Response) => {
    const { balance } = req.body;
    try {
        const userId = addUser(balance);
        res.status(201).send(`User added successfully - ${userId}`);
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
        res.status(400).send(errorMessage);
    }
});

// 6. PATCH /users/balance/:userId - Update user balance
app.patch('/users/balance/:userId', (req: Request, res: Response) => {
    const userId = req.params.userId;
    const { balance } = req.body;
    try {
        updateBalance({ userId, balance });
        res.send(`User balance updated successfully`);
    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';
        res.status(400).send(errorMessage);
    }
});

// 7. GET /users/balance/:userId - Get user balance
app.get('/users/balance/:userId', (req: Request, res: Response) => {
    const userId = req.params.userId;
    const userBalance = getUserBalance(userId);
    res.json(userBalance);
});


// ------------------------------ Start the Server ------------------------------
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
