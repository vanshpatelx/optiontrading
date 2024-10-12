# Option Trading System

### Key Features:
1. **Order Management**: Create buy and sell orders.
2. **Portfolio Management**: Handle the portfolio and order book.
3. **Balance Management**: Manage user balance, including deposits and withdrawals.

### API Endpoints:
1. **Buy/Sell Stock**: Place buy or sell orders.
2. **Get Portfolio Details**: Retrieve the current state of the user’s portfolio.
3. **Order Book (History)**: View the order history.
4. **Manage User Balance**: Get and add balance for users.
5. **Add Stock**: Add new stocks to the system.
6. **Add User**: Register new users.

### Development Approach:
- [x] **Phase 1: Functional Prototype**
   - Initial implementation using core functions.
   - **Challenges/Improvements**:
     1. Need to call the exchange for order matching after every placement.
- [X] **Phase 2: API Layer**: Build API layer
- [X] **Phase 3: Exchange Logic**: Seprate exchange and stock managment.
- [ ] **Phase 4: WebSocket Integration**: Add WebSocket 
- [ ] **Phase 5: Authentication**: authentication and authorization.