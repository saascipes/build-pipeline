"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AMQPLib_1 = require("../../shared/AMQPLib");
const SGLogger_1 = require("../../shared/SGLogger");
const config = require("config");
var PayloadOperation;
(function (PayloadOperation) {
    PayloadOperation[PayloadOperation["CREATE"] = 1] = "CREATE";
    PayloadOperation[PayloadOperation["UPDATE"] = 2] = "UPDATE";
    PayloadOperation[PayloadOperation["DELETE"] = 3] = "DELETE";
})(PayloadOperation = exports.PayloadOperation || (exports.PayloadOperation = {}));
const appName = "RabbitMQPublisher";
const amqpUrl = config.get('amqpUrl');
const rmqVhost = config.get('rmqVhost');
const rmqBrowserPushRoute = config.get('rmqBrowserPushRoute');
const rmqStockQuotePublisherQueue = config.get('rmqStockQuotePublisherQueue');
const exch = config.get('rmqExchange');
class RabbitMQPublisher {
    constructor() {
        this.started = false;
    }
    async start() {
        let logger = new SGLogger_1.BaseLogger(appName);
        logger.Start();
        this.amqp = new AMQPLib_1.AMQPConnector(appName, '', amqpUrl, rmqVhost, 1, (activeMessages) => { }, logger);
        await this.amqp.Start();
        this.started = true;
    }
    // todo
    async publish(domainType, correlationId, operation, data) {
        if (!this.started) {
            await this.start();
        }
        this.amqp.PublishRoute(exch, rmqBrowserPushRoute, { domainType, operation, model: data, correlationId });
    }
    async publishStockQuotesSubscriptionUpdate(data) {
        if (!this.started) {
            await this.start();
        }
        this.amqp.PublishRoute(exch, rmqStockQuotePublisherQueue, data);
    }
}
exports.rabbitMQPublisher = new RabbitMQPublisher();
//# sourceMappingURL=RabbitMQPublisher.js.map