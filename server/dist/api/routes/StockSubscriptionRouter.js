"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StockSubscriptionController_1 = require("../controllers/StockSubscriptionController");
class StockSubscriptionRouter {
    constructor() {
        this.router = express_1.Router();
        this.router.get('/', StockSubscriptionController_1.stockSubscriptionController.getManyStockSubscriptions);
        this.router.get('/:stockSubscriptionId', StockSubscriptionController_1.stockSubscriptionController.getStockSubscription);
        this.router.post('/', StockSubscriptionController_1.stockSubscriptionController.createStockSubscription);
        this.router.put('/:stockSubscriptionId', StockSubscriptionController_1.stockSubscriptionController.updateStockSubscription);
        this.router.delete('/:stockSubscriptionId', StockSubscriptionController_1.stockSubscriptionController.deleteStockSubscription);
    }
}
exports.StockSubscriptionRouter = StockSubscriptionRouter;
exports.stockSubscriptionRouterSingleton = new StockSubscriptionRouter();
exports.stockSubscriptionRouter = exports.stockSubscriptionRouterSingleton.router;
//# sourceMappingURL=StockSubscriptionRouter.js.map