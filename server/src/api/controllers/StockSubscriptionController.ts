import { Request, Response, NextFunction, response } from 'express';
import { ResponseWrapper, ResponseCode } from '../utils/Types';
import { StockSubscriptionSchema, StockSubscriptionModel } from '../domain/StockSubscription';
import { defaultBulkGet } from '../utils/BulkGet';
import { stockSubscriptionService } from '../services/StockSubscriptionService';
import { MissingObjectError } from '../utils/Errors';
import { CastError } from 'mongoose';
import { convertData as convertResponseData } from '../utils/ResponseConverters';
import { convertData as convertRequestData } from '../utils/RequestConverters';
import * as _ from 'lodash';
import * as mongodb from 'mongodb';


export class StockSubscriptionController {

    public async getManyStockSubscriptions(req: Request, resp: Response, next: NextFunction): Promise<void> {
        defaultBulkGet({}, req, resp, next, StockSubscriptionSchema, StockSubscriptionModel, stockSubscriptionService);
    }


    public async getStockSubscription(req: Request, resp: Response, next: NextFunction): Promise<void> {
        try {
            const response: ResponseWrapper = (resp as any).body;
            const stockSubscription = await stockSubscriptionService.findStockSubscription(new mongodb.ObjectId(req.params.stockSubscriptionId), (<string>req.query.responseFields));

            if (_.isArray(stockSubscription) && stockSubscription.length === 0) {
                next(new MissingObjectError(`StockSubscription ${req.params.stockSubscriptionId} not found.`));
            }
            else {
                response.data = convertResponseData(StockSubscriptionSchema, stockSubscription[0]);
                next();
            }
        }
        catch (err) {
            // If req.params.stockSubscriptionId wasn't a mongo id then we will get a CastError - basically same as if the id wasn't found
            if (err instanceof CastError) {
                next(new MissingObjectError(`StockSubscription ${req.params.stockSubscriptionId} not found.`));
            }
            else {
                next(err);
            }
        }
    }


    public async createStockSubscription(req: Request, resp: Response, next: NextFunction): Promise<void> {
        const response: ResponseWrapper = resp['body'];
        try {
            const newStockSubscription = await stockSubscriptionService.createStockSubscription(convertRequestData(StockSubscriptionSchema, req.body), req.header('correlationId'), (<string>req.query.responseFields));
            response.data = convertResponseData(StockSubscriptionSchema, newStockSubscription);
            response.statusCode = ResponseCode.CREATED;
            next();
        }
        catch (err) {
            next(err);
        }
    }


    public async updateStockSubscription(req: Request, resp: Response, next: NextFunction): Promise<void> {
        const response: ResponseWrapper = resp['body'];
        try {
            const updatedStockSubscription: any = await stockSubscriptionService.updateStockSubscription(new mongodb.ObjectId(req.params.stockSubscriptionId), convertRequestData(StockSubscriptionSchema, req.body), req.header('correlationId'), (<string>req.query.responseFields));

            if (_.isArray(updatedStockSubscription) && updatedStockSubscription.length === 0) {
                next(new MissingObjectError(`StockSubscription ${req.params.stockSubscriptionId} not found.`));
            }
            else {
                response.data = convertResponseData(StockSubscriptionSchema, updatedStockSubscription);
                response.statusCode = ResponseCode.OK;
                next();
            }
        }
        catch (err) {
            next(err);
        }
    }


    public async deleteStockSubscription(req: Request, resp: Response, next: NextFunction): Promise<void> {
        const response: ResponseWrapper = resp['body'];
        try {
            response.data = await stockSubscriptionService.deleteStockSubscription(new mongodb.ObjectId(req.params.stockSubscriptionId), req.header('correlationId'));
            response.statusCode = ResponseCode.OK;
            next();
        }
        catch (err) {
            next(err);
        }
    }
}

export const stockSubscriptionController = new StockSubscriptionController();