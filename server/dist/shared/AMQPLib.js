"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
let removeItemFromArray = (array, item) => {
    const index = array.indexOf(item);
    if (index > -1)
        array.splice(index, 1);
};
let sleep = async (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};
class AMQPConnector {
    constructor(appName, clientId, url, vhost, prefetchCount, fnOnDisconnect, logger) {
        this.appName = appName;
        this.clientId = clientId;
        this.url = url;
        this.vhost = vhost;
        this.prefetchCount = prefetchCount;
        this.fnOnDisconnect = fnOnDisconnect;
        this.logger = logger;
        this.activeMessages = [];
        this.amqp = require('amqplib');
        this.subscribedRoutes = [];
        this.subscriptions = [];
        this.stoppedByUser = false;
        this.offlinePubQueue = [];
    }
    LogWarning(msg, values) {
        this.logger.LogWarning(msg, Object.assign({ '_appName': this.appName, 'ClientId': this.clientId }, values));
    }
    LogInfo(content, consumerTag, deliveryTag, redelivered, exchange, routingkey, values) {
        this.logger.LogInfo(content, Object.assign({ '_appName': this.appName, 'ClientId': this.clientId, 'ConsumerTag': consumerTag, 'DeliveryTag': deliveryTag, 'Redelivered': redelivered, 'Exchange': exchange, 'Routingkey': routingkey }, values));
    }
    LogError(msg, stackTrace, values) {
        this.logger.LogError(msg, Object.assign({ '_appName': this.appName, 'Stack': stackTrace, 'ClientId': this.clientId }, values));
    }
    LogDebug(msg, values) {
        this.logger.LogDebug(msg, Object.assign({ '_appName': this.appName, 'ClientId': this.clientId }, values));
    }
    async Start() {
        this.stoppedByUser = false;
        if (this.conn) {
            return;
        }
        this.LogDebug('Received request to start AMQP connection to RabbitMQ', { 'url': this.url, 'Vhost': this.vhost });
        try {
            this.conn = await this.amqp.connect(this.url);
        }
        catch (e) {
            this.LogError('Error starting AMQP connection to RabbitMQ', '', { error: e });
            await this.OnDisconnect();
            return false;
        }
        this.conn.on('error', (err) => {
            this.LogError('AMQP connection error', '', { error: err });
            this.OnDisconnect();
        });
        this.conn.on('close', async () => {
            this.LogDebug('AMQP connection closed', {});
            this.conn = null;
            if (!this.stoppedByUser) {
                await sleep(10000);
                this.Start();
            }
        });
        this.LogDebug('Completed request to start AMQP connection', { 'url': this.url, 'Vhost': this.vhost });
        this.subscribedRoutes.forEach(async (params) => {
            if (params['route']) {
                this.LogDebug('Resubscribing to route', { 'QueueName': params['queueName'], 'exchange': params['Rxchange'], 'Route': params['route'], 'expires': params['expires'] });
                await this.ConsumeRoute(params['queueName'], params['exclusive'], params['durable'], params['autoDelete'], params['noAck'], params['fnHandleMessage'], params['exchange'], params['route'], params['expires']);
            }
            else {
                this.LogDebug('Resubscribing to queue', { 'QueueName': params['queueName'], 'expires': params['expires'] });
                await this.ConsumeQueue(params['queueName'], params['exclusive'], params['durable'], params['autoDelete'], params['noAck'], params['fnHandleMessage'], params['exchange'], params['expires']);
            }
        });
        this.subscribedRoutes.length = 0;
        return true;
    }
    async Stop(stoppedByUser = true) {
        this.stoppedByUser = stoppedByUser;
        this.LogDebug('Received request to stop AMQP connection', {});
        try {
            if (this.consumerChannel) {
                this.consumerChannel = null;
            }
            if (this.pubChannel) {
                this.pubChannel = null;
            }
            await this.conn.close();
            this.LogDebug('Completed request to stop AMQP connection', {});
        }
        catch (e) {
            this.LogError('Error stopping AMQP connection', '', { error: e });
        }
    }
    async OnDisconnect() {
        this.LogDebug('OnDisconnect called', {});
        this.fnOnDisconnect(this.activeMessages.slice());
        this.activeMessages = [];
        if (!this.stoppedByUser) {
            await this.Stop(false);
        }
    }
    async CreateConsumerChannel() {
        if (this.consumerChannel)
            return;
        try {
            this.consumerChannel = await this.conn.createChannel();
        }
        catch (e) {
            this.LogError('Error creating consumer channel', '', { error: e });
            await this.OnDisconnect();
            return;
        }
        this.consumerChannel.on('error', (err) => {
            this.LogError('Consumer channel error', '', { error: err });
            this.OnDisconnect();
        });
        this.consumerChannel.on('close', () => {
            this.LogDebug('Consumer channel closed', { 'StoppedByUser': this.stoppedByUser });
        });
        this.consumerChannel.prefetch(this.prefetchCount);
        this.LogDebug('Consumer channel created', {});
        return;
    }
    async CreatePublisherChannel() {
        if (this.pubChannel)
            return;
        try {
            this.pubChannel = await this.conn.createConfirmChannel();
        }
        catch (e) {
            this.LogError('Error creating publisher channel', '', { error: e });
            await this.OnDisconnect();
            return;
        }
        this.pubChannel.on('error', (err) => {
            this.LogError('Publisher channel error', '', { error: err });
            this.OnDisconnect();
        });
        this.pubChannel.on('close', () => {
            this.LogDebug('Publisher channel closed', { 'StoppedByUser': this.stoppedByUser });
        });
        this.pubChannel.on('return', (val) => {
            this.LogDebug('Publisher channel message returned', { 'fields': val.fields, 'properties': val.properties, 'content': val.content.toString('utf8') });
        });
        while (true) {
            let m = this.offlinePubQueue.shift();
            if (!m)
                break;
            if (m[0] == 'queue')
                this.PublishQueue(m[1], m[2], m[3], m[4], m[5]);
            else
                this.PublishRoute(m[1], m[2], m[3], m[4]);
        }
    }
    async PublishQueue(exchange, routingKey, content, queueAssertArgs, args = {}) {
        if (!routingKey || (routingKey == ''))
            return;
        try {
            await this.CreatePublisherChannel();
            if (exchange != '') {
                await this.AssertExchange(exchange, 'topic', true, false, false);
            }
            args = Object.assign(queueAssertArgs, args);
            await this.pubChannel.assertQueue(routingKey, args);
            await this.pubChannel.bindQueue(routingKey, exchange, routingKey);
            let res = await this.PublishLocal(exchange, routingKey, content, args);
            // this.LogDebug('Published message', { 'Exchange': exchange, 'Route': routingKey, 'Content': content, 'Response': res });
        }
        catch (e) {
            if (this.stoppedByUser)
                return;
            this.LogError('Error publishing message', e.stack, { 'Error': e.message, 'Exchange': exchange, 'Route': routingKey, 'Content': content, 'args': args });
            this.offlinePubQueue.push(['queue', exchange, routingKey, content, queueAssertArgs, args]);
            this.OnDisconnect();
        }
    }
    async PublishRoute(exchange, routingKey, content, args = {}) {
        if (!routingKey || (routingKey == ''))
            return;
        try {
            await this.CreatePublisherChannel();
            if (exchange != '')
                await this.AssertExchange(exchange, 'topic', true, false, false);
            let res = await this.PublishLocal(exchange, routingKey, content, args);
            // this.LogDebug('Published message', { 'Exchange': exchange, 'Route': routingKey, 'Content': content, 'Response': res });
        }
        catch (e) {
            if (this.stoppedByUser)
                return;
            this.LogError('Error publishing message', e.stack, { 'Error': e.message, 'Exchange': exchange, 'Route': routingKey, 'Content': content, 'args': args });
            this.offlinePubQueue.push(['route', exchange, routingKey, content, args]);
            this.OnDisconnect();
        }
    }
    async PublishLocal(exchange, routingKey, content, args) {
        return new Promise(async (resolve, reject) => {
            let res = await this.pubChannel.publish(exchange, routingKey, Buffer.from(JSON.stringify(content)), Object.assign({ persistent: true, mandatory: true }, args), (err, ok, val) => {
                if (err)
                    reject(err);
                resolve(res);
            });
        });
    }
    async AssertExchange(exchange, type, durable, internal, autoDelete) {
        if (!exchange || (exchange == ''))
            return;
        let options = { durable: durable, internal: internal, autoDelete: autoDelete };
        let res;
        if (this.pubChannel)
            res = await this.pubChannel.assertExchange(exchange, type, options);
        else if (this.consumerChannel)
            res = await this.consumerChannel.assertExchange(exchange, type, options);
    }
    async ConsumeQueue(queueName, exclusive, durable, autoDelete, noAck, fnHandleMessage, exchange, expires = 0) {
        if (!queueName || (queueName == ''))
            return;
        let sub;
        try {
            await this.CreateConsumerChannel();
            if (exchange != '')
                await this.AssertExchange(exchange, 'topic', true, false, false);
            let headers = { exclusive: exclusive, durable: durable, autoDelete: autoDelete };
            if (expires > 0)
                headers['expires'] = expires;
            await this.consumerChannel.assertQueue(queueName, headers);
            if (exchange && (exchange != '')) {
                await this.consumerChannel.bindQueue(queueName, exchange, queueName);
            }
            sub = await this.consumerChannel.consume(queueName, (msg) => {
                if (msg != null) {
                    try {
                        this.LogDebug('Message received', { 'Fields': util.inspect(msg.fields), 'Properties': util.inspect(msg.properties), 'Content': msg.content.toString('utf8') });
                        let msgKey = `${msg.fields['routingKey']}.${msg.fields['consumerTag']}.${msg.fields['deliveryTag']}`;
                        this.activeMessages.push(msgKey);
                        fnHandleMessage(JSON.parse(msg.content.toString('utf8')), msgKey, msg.fields, msg.properties, (ok, msgKey) => {
                            if (!noAck) {
                                if (this.activeMessages.indexOf(msgKey) > -1) {
                                    try {
                                        if (ok)
                                            this.consumerChannel.ack(msg);
                                        else
                                            this.consumerChannel.reject(msg, true);
                                    }
                                    catch (e) {
                                        this.LogError('Error occurred acking AMQP message', '', { error: e, 'EventArgs': util.inspect(msg, false, null) });
                                    }
                                }
                            }
                        });
                    }
                    catch (e) {
                        this.LogError('Error receiving message', e.stack, { 'QueueName': queueName });
                    }
                }
            }, { noAck: noAck });
            this.subscriptions.push(sub);
            this.subscribedRoutes.push({ 'queueName': queueName, 'exclusive': exclusive, 'durable': durable, 'autoDelete': autoDelete, 'noAck': noAck, 'fnHandleMessage': fnHandleMessage, 'exchange': exchange, 'expires': expires });
            this.LogDebug('Consuming queue', { 'QueueName': queueName });
        }
        catch (e) {
            this.LogError('Error consuming AMQP queue', e.stack, { 'QueueName': queueName });
            // this.OnDisconnect();
        }
        return sub;
    }
    async ConsumeRoute(queueName, exclusive, durable, autoDelete, noAck, fnHandleMessage, exchange, route, expires = 0) {
        if (!route || (route == ''))
            return;
        try {
            await this.CreateConsumerChannel();
            let headers = { exclusive: exclusive, durable: durable, autoDelete: autoDelete };
            if (expires > 0)
                headers['expires'] = expires;
            let res = await this.consumerChannel.assertQueue(queueName, headers);
            let q = res['queue'];
            await this.consumerChannel.bindQueue(q, exchange, route);
            await this.consumerChannel.consume(q, (msg) => {
                if (msg != null) {
                    try {
                        this.LogDebug('Message received', { 'Fields': util.inspect(msg.fields), 'Properties': util.inspect(msg.properties), 'Content': msg.content.toString('utf8') });
                        let msgKey = `${msg.fields['routingKey']}.${msg.fields['consumerTag']}.${msg.fields['deliveryTag']}`;
                        this.activeMessages.push(msgKey);
                        fnHandleMessage(JSON.parse(msg.content.toString('utf8')), msgKey, (ok, msgKey) => {
                            if (!noAck) {
                                if (this.activeMessages.indexOf(msgKey) > -1) {
                                    try {
                                        if (ok)
                                            this.consumerChannel.ack(msg);
                                        else
                                            this.consumerChannel.reject(msg, true);
                                    }
                                    catch (e) {
                                        this.LogError('Error occurred acking AMQP message', '', { error: e, 'EventArgs': util.inspect(msg, false, null) });
                                    }
                                }
                            }
                        });
                    }
                    catch (e) {
                        this.LogError('Error receiving message', e.stack, { 'QueueName': queueName });
                    }
                }
            }, { noAck: noAck });
            this.subscribedRoutes.push({ 'queueName': queueName, 'exclusive': exclusive, 'durable': durable, 'autoDelete': autoDelete, 'noAck': noAck, 'fnHandleMessage': fnHandleMessage, 'exchange': exchange, 'route': route, 'expires': expires });
            this.LogDebug('Consuming route', { 'QueueName': q, 'Exchange': exchange, 'Route': route });
        }
        catch (e) {
            this.LogError(`Error consuming AMQP route: ${e.message}`, e.stack, { 'QueueName': queueName, 'Exchange': exchange, 'Route': route });
            // this.OnDisconnect();
        }
    }
    async PurgeQueue(queueName) {
        try {
            await this.CreateConsumerChannel();
            await this.consumerChannel.purgeQueue(queueName);
            this.LogDebug('Purged queue', { 'QueueName': queueName });
        }
        catch (e) {
            this.LogError('Error purging queue', e.stack, { 'QueueName': queueName });
        }
    }
    async StopConsumingQueue(sub) {
        try {
            this.LogDebug('Unsubscribing', { 'Subscription': util.inspect(sub, false, null) });
            await this.consumerChannel.cancel(sub.consumerTag);
            removeItemFromArray(this.subscriptions, sub);
        }
        catch (e) {
            this.LogError('Error in StopConsumingQueue', '', { error: e });
        }
    }
    async Unbind(queue, exch, route, args = {}) {
        try {
            this.LogDebug('Unbinding', { 'Exchange': exch, 'Queue': queue, 'Route': route });
            await this.consumerChannel.unbindQueue(queue, exch, route, args);
        }
        catch (e) {
            this.LogError('Error in Unbind', '', { error: e });
        }
    }
    async StopConsuming() {
        try {
            while (this.subscriptions.length > 0)
                await this.StopConsumingQueue(this.subscriptions[0]);
        }
        catch (e) {
            this.LogError('Error in StopConsuming', '', { error: e });
        }
    }
}
exports.AMQPConnector = AMQPConnector;
//# sourceMappingURL=AMQPLib.js.map