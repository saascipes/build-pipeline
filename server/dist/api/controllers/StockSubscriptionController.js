"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Types_1 = require("../utils/Types");
const StockSubscription_1 = require("../domain/StockSubscription");
const BulkGet_1 = require("../utils/BulkGet");
const StockSubscriptionService_1 = require("../services/StockSubscriptionService");
const Errors_1 = require("../utils/Errors");
const mongoose_1 = require("mongoose");
const ResponseConverters_1 = require("../utils/ResponseConverters");
const RequestConverters_1 = require("../utils/RequestConverters");
const _ = require("lodash");
const mongodb = require("mongodb");
class StockSubscriptionController {
    async getManyStockSubscriptions(req, resp, next) {
        BulkGet_1.defaultBulkGet({}, req, resp, next, StockSubscription_1.StockSubscriptionSchema, StockSubscription_1.StockSubscriptionModel, StockSubscriptionService_1.stockSubscriptionService);
    }
    async getStockSubscription(req, resp, next) {
        try {
            const response = resp.body;
            const stockSubscription = await StockSubscriptionService_1.stockSubscriptionService.findStockSubscription(new mongodb.ObjectId(req.params.stockSubscriptionId), req.query.responseFields);
            if (_.isArray(stockSubscription) && stockSubscription.length === 0) {
                next(new Errors_1.MissingObjectError(`StockSubscription ${req.params.stockSubscriptionId} not found.`));
            }
            else {
                response.data = ResponseConverters_1.convertData(StockSubscription_1.StockSubscriptionSchema, stockSubscription[0]);
                next();
            }
        }
        catch (err) {
            // If req.params.stockSubscriptionId wasn't a mongo id then we will get a CastError - basically same as if the id wasn't found
            if (err instanceof mongoose_1.CastError) {
                next(new Errors_1.MissingObjectError(`StockSubscription ${req.params.stockSubscriptionId} not found.`));
            }
            else {
                next(err);
            }
        }
    }
    async createStockSubscription(req, resp, next) {
        const response = resp['body'];
        try {
            const newStockSubscription = await StockSubscriptionService_1.stockSubscriptionService.createStockSubscription(RequestConverters_1.convertData(StockSubscription_1.StockSubscriptionSchema, req.body), req.header('correlationId'), req.query.responseFields);
            response.data = ResponseConverters_1.convertData(StockSubscription_1.StockSubscriptionSchema, newStockSubscription);
            response.statusCode = Types_1.ResponseCode.CREATED;
            next();
        }
        catch (err) {
            next(err);
        }
    }
    async updateStockSubscription(req, resp, next) {
        const response = resp['body'];
        try {
            const updatedStockSubscription = await StockSubscriptionService_1.stockSubscriptionService.updateStockSubscription(new mongodb.ObjectId(req.params.stockSubscriptionId), RequestConverters_1.convertData(StockSubscription_1.StockSubscriptionSchema, req.body), req.header('correlationId'), req.query.responseFields);
            if (_.isArray(updatedStockSubscription) && updatedStockSubscription.length === 0) {
                next(new Errors_1.MissingObjectError(`StockSubscription ${req.params.stockSubscriptionId} not found.`));
            }
            else {
                response.data = ResponseConverters_1.convertData(StockSubscription_1.StockSubscriptionSchema, updatedStockSubscription);
                response.statusCode = Types_1.ResponseCode.OK;
                next();
            }
        }
        catch (err) {
            next(err);
        }
    }
    async deleteStockSubscription(req, resp, next) {
        const response = resp['body'];
        try {
            response.data = await StockSubscriptionService_1.stockSubscriptionService.deleteStockSubscription(new mongodb.ObjectId(req.params.stockSubscriptionId), req.header('correlationId'));
            response.statusCode = Types_1.ResponseCode.OK;
            next();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.StockSubscriptionController = StockSubscriptionController;
exports.stockSubscriptionController = new StockSubscriptionController();
//# sourceMappingURL=StockSubscriptionController.js.map