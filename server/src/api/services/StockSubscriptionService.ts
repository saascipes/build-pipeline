import { convertData } from '../utils/ResponseConverters';
import { StockSubscriptionSchema, StockSubscriptionModel } from '../domain/StockSubscription';
import { rabbitMQPublisher, PayloadOperation } from '../utils/RabbitMQPublisher';
import { MissingObjectError, ValidationError } from '../utils/Errors';
import * as mongodb from 'mongodb';
import * as _ from 'lodash';


export class StockSubscriptionService {

    public async findAllStockSubscriptionsInternal(filter?: any, responseFields?: string) {
        return StockSubscriptionModel.find(filter).select(responseFields);
    }


    public async findStockSubscription(stockSubscriptionId: mongodb.ObjectId, responseFields?: string) {
        return StockSubscriptionModel.findById(stockSubscriptionId).find({ }).select(responseFields);
    }


    public async createStockSubscriptionInternal(data: any): Promise<object> {
        const model = new StockSubscriptionModel(data);
        const newStockSubscription = await model.save();
        return newStockSubscription;
    }


    public async createStockSubscription(data: any, correlationId: string, responseFields?: string): Promise<object> {
        const existingStockSubscriptionQuery: any = await this.findAllStockSubscriptionsInternal({ ticker: data.ticker });
        if (_.isArray(existingStockSubscriptionQuery) && existingStockSubscriptionQuery.length > 0)
            return await this.updateStockSubscription(existingStockSubscriptionQuery[0]._id, data, correlationId, responseFields);

        if (!data.expires)
            data.expires = Date.now() + (1000 * 60 * 20); // 20 minutes

        const stockSubscriptionModel = new StockSubscriptionModel(data);
        const newStockSubscription = await stockSubscriptionModel.save();

        await rabbitMQPublisher.publish("StockSubscription", correlationId, PayloadOperation.CREATE, convertData(StockSubscriptionSchema, newStockSubscription));

        await rabbitMQPublisher.publishStockQuotesSubscriptionUpdate(convertData(StockSubscriptionSchema, newStockSubscription));

        if (responseFields) {
            // It's is a bit wasteful to do another query but I can't chain a save with a select
            return this.findStockSubscription(newStockSubscription._id, responseFields);
        }
        else {
            return newStockSubscription; // fully populated model
        }
    }


    public async updateStockSubscription(id: mongodb.ObjectId, data: any, correlationId: string, responseFields?: string): Promise<object> {
        const filter = { _id: id };

        data.expires = Date.now() + (1000 * 60 * 20); // 20 minutes

        const updatedStockSubscription = await StockSubscriptionModel.findOneAndUpdate(filter, data, { new: true }).select(responseFields);

        if (!updatedStockSubscription)
            throw new ValidationError(`StockSubscription '${id}" not found with filter "${JSON.stringify(filter, null, 4)}'.`)

        const deltas = Object.assign({ _id: id }, data);
        const ret = convertData(StockSubscriptionSchema, deltas);
        await rabbitMQPublisher.publish("StockSubscription", correlationId, PayloadOperation.UPDATE, ret);

        await rabbitMQPublisher.publishStockQuotesSubscriptionUpdate(ret);

        return updatedStockSubscription; // fully populated model
    }



    public async deleteStockSubscription(id: mongodb.ObjectId, correlationId: string): Promise<object> {
        const deleted = await StockSubscriptionModel.deleteOne({ _id: id });

        await rabbitMQPublisher.publish("StockSubscription", correlationId, PayloadOperation.DELETE, { id: id });

        return deleted;
    }
}

export const stockSubscriptionService = new StockSubscriptionService();