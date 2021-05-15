"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResponseConverters_1 = require("../utils/ResponseConverters");
const StockSubscription_1 = require("../domain/StockSubscription");
const RabbitMQPublisher_1 = require("../utils/RabbitMQPublisher");
const Errors_1 = require("../utils/Errors");
const _ = require("lodash");
// import { SGUtils } from '../../shared/SGUtils';
class StockSubscriptionService {
    // Some services might need to add additional restrictions to bulk queries
    // This is how they would add more to the base query (Example: fetch only non-deleted users for all queries)
    // public async updateBulkQuery(query): Promise<object> {
    //   // modify query here
    //   return query;
    // }
    // public async findAllStockSubscriptions(: string, _taskId: string, responseFields?: string) {
    //     return StockSubscriptionModel.find({ _taskId }).select(responseFields);
    // }
    async findAllStockSubscriptionsInternal(filter, responseFields) {
        return StockSubscription_1.StockSubscriptionModel.find(filter).select(responseFields);
    }
    async findStockSubscription(stockSubscriptionId, responseFields) {
        return StockSubscription_1.StockSubscriptionModel.findById(stockSubscriptionId).find({}).select(responseFields);
    }
    async createStockSubscriptionInternal(data) {
        const model = new StockSubscription_1.StockSubscriptionModel(data);
        const newStockSubscription = await model.save();
        return newStockSubscription;
    }
    async createStockSubscription(data, correlationId, responseFields) {
        const existingStockSubscriptionQuery = await this.findAllStockSubscriptionsInternal({ ticker: data.ticker });
        if (_.isArray(existingStockSubscriptionQuery) && existingStockSubscriptionQuery.length > 0)
            return await this.updateStockSubscription(existingStockSubscriptionQuery[0]._id, data, correlationId, responseFields);
        if (!data.expires)
            data.expires = Date.now() + (1000 * 60 * 20); // 20 minutes
        const stockSubscriptionModel = new StockSubscription_1.StockSubscriptionModel(data);
        const newStockSubscription = await stockSubscriptionModel.save();
        await RabbitMQPublisher_1.rabbitMQPublisher.publish("StockSubscription", correlationId, RabbitMQPublisher_1.PayloadOperation.CREATE, ResponseConverters_1.convertData(StockSubscription_1.StockSubscriptionSchema, newStockSubscription));
        await RabbitMQPublisher_1.rabbitMQPublisher.publishStockQuotesSubscriptionUpdate(ResponseConverters_1.convertData(StockSubscription_1.StockSubscriptionSchema, newStockSubscription));
        if (responseFields) {
            // It's is a bit wasteful to do another query but I can't chain a save with a select
            return this.findStockSubscription(newStockSubscription._id, responseFields);
        }
        else {
            return newStockSubscription; // fully populated model
        }
    }
    async updateStockSubscription(id, data, correlationId, responseFields) {
        const filter = { _id: id };
        data.expires = Date.now() + (1000 * 60 * 20); // 20 minutes
        const updatedStockSubscription = await StockSubscription_1.StockSubscriptionModel.findOneAndUpdate(filter, data, { new: true }).select(responseFields);
        if (!updatedStockSubscription)
            throw new Errors_1.ValidationError(`StockSubscription '${id}" not found with filter "${JSON.stringify(filter, null, 4)}'.`);
        const deltas = Object.assign({ _id: id }, data);
        const ret = ResponseConverters_1.convertData(StockSubscription_1.StockSubscriptionSchema, deltas);
        await RabbitMQPublisher_1.rabbitMQPublisher.publish("StockSubscription", correlationId, RabbitMQPublisher_1.PayloadOperation.UPDATE, ret);
        await RabbitMQPublisher_1.rabbitMQPublisher.publishStockQuotesSubscriptionUpdate(ret);
        return updatedStockSubscription; // fully populated model
    }
    async deleteStockSubscription(id, correlationId) {
        const deleted = await StockSubscription_1.StockSubscriptionModel.deleteOne({ _id: id });
        await RabbitMQPublisher_1.rabbitMQPublisher.publish("StockSubscription", correlationId, RabbitMQPublisher_1.PayloadOperation.DELETE, { id: id });
        return deleted;
    }
}
exports.StockSubscriptionService = StockSubscriptionService;
exports.stockSubscriptionService = new StockSubscriptionService();
//# sourceMappingURL=StockSubscriptionService.js.map