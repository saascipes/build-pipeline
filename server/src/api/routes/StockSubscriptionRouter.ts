import { Router } from 'express';
import { stockSubscriptionController } from '../controllers/StockSubscriptionController';

export class StockSubscriptionRouter {

  public readonly router: Router;

  constructor() {
    this.router = Router();

    this.router.get('/',  stockSubscriptionController.getManyStockSubscriptions);
    this.router.get('/:stockSubscriptionId', stockSubscriptionController.getStockSubscription);
    this.router.post('/', stockSubscriptionController.createStockSubscription);
    this.router.put('/:stockSubscriptionId', stockSubscriptionController.updateStockSubscription);
    this.router.delete('/:stockSubscriptionId', stockSubscriptionController.deleteStockSubscription);
  }
}

export const stockSubscriptionRouterSingleton = new StockSubscriptionRouter();
export const stockSubscriptionRouter = stockSubscriptionRouterSingleton.router;