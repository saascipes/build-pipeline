"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SGUtils_1 = require("./SGUtils");
const util = require("util");
const RabbitMQAdmin_1 = require("./RabbitMQAdmin");
const stompjs_1 = require("@stomp/stompjs");
const AsyncLock = require("async-lock");
Object.assign(global, { WebSocket: require('websocket').w3cwebsocket });
// These have been added in NodeJS v11, so good idea is to check first
if (typeof TextEncoder !== 'function') {
    const TextEncodingPolyfill = require('text-encoding');
    Object.assign(global, { TextEncoder: TextEncodingPolyfill.TextEncoder });
    Object.assign(global, { TextDecoder: TextEncodingPolyfill.TextDecoder });
}
class StompConnector {
    constructor(appName, clientId, url, userName, password, rmqAdminUrl, vhost, prefetchCount, fnOnDisconnect, logger) {
        this.appName = appName;
        this.clientId = clientId;
        this.url = url;
        this.userName = userName;
        this.password = password;
        this.rmqAdminUrl = rmqAdminUrl;
        this.vhost = vhost;
        this.prefetchCount = prefetchCount;
        this.fnOnDisconnect = fnOnDisconnect;
        this.logger = logger;
        // logger: SGLogger.StompLogger;
        this.activeMessages = [];
        this.lock = new AsyncLock();
        this.OnStompError = (err) => {
            this.LogError(`Stomp error occurred: ${err}`, '', {});
            this.connectedToStomp = false;
            this.OnDisconnect();
        };
        // this.logger = new SGLogger.StompLogger(appName, clientId);
        this.subscribedRoutes = [];
        this.subscriptions = [];
        this.stoppedByUser = false;
        this.connectedToStomp = false;
        this.offlinePubQueue = [];
        this.rmqAdmin = new RabbitMQAdmin_1.RabbitMQAdmin(rmqAdminUrl, vhost, this.logger);
    }
    LogError(msg, stackTrace, values) {
        this.logger.LogError(msg, Object.assign({ 'StackTrace': stackTrace, 'ClientId': this.clientId }, values));
    }
    LogWarning(msg, values) {
        this.logger.LogWarning(msg, values);
    }
    LogInfo(content, consumerTag, redelivered, destination, values) {
        this.logger.LogInfo(content, Object.assign({ 'ClientId': this.clientId, 'ConsumerTag': consumerTag, 'Redelivered': redelivered, 'Destination': destination }, values));
    }
    LogDebug(msg, values) {
        this.logger.LogDebug(msg, Object.assign({ 'ClientId': this.clientId }, values));
    }
    Start() {
        this.stoppedByUser = false;
        return new Promise(async (resolve, reject) => {
            try {
                this.stompClient = new stompjs_1.Client({
                    brokerURL: this.url,
                    connectHeaders: {
                        login: this.userName,
                        passcode: this.password,
                        host: this.vhost
                    },
                    heartbeatIncoming: 10000,
                    heartbeatOutgoing: 10000
                });
                this.stompClient.onConnect = this.OnConnect.bind(this);
                this.stompClient.onStompError = this.OnStompError.bind(this);
                this.stompClient.activate();
                this.LogDebug('Completed request to start Stomp connection to RabbitMQ', {
                    'RmqUrl': this.url,
                    'Vhost': this.vhost,
                    'UserName': this.userName
                });
                while (true) {
                    if (this.connectedToStomp) {
                        resolve();
                        return;
                    }
                    if (this.stoppedByUser)
                        break;
                    await SGUtils_1.SGUtils.sleep(500);
                }
            }
            catch (e) {
                this.LogError('Error connecting to RabbitMQ: ' + e.message, e.stack, {});
                this.connectedToStomp = false;
                this.OnDisconnect();
                reject(e);
            }
        });
    }
    async Stop(stoppedByUser = true) {
        this.stoppedByUser = stoppedByUser;
        return new Promise((resolve, reject) => {
            this.LogDebug('Received request to stop Stomp connection to RabbitMQ', {});
            try {
                if (this.stompClient) {
                    this.stompClient.forceDisconnect();
                    this.LogDebug('Completed request to stop Stomp connection to RabbitMQ', {});
                    resolve();
                }
            }
            catch (e) {
                this.LogError('Error stopping Stomp connection: ' + e.message, e.stack, {});
                resolve();
            }
        });
    }
    OnConnect() {
        this.connectedToStomp = true;
        this.LogDebug('Connected to Stomp', {});
        this.subscribedRoutes.forEach(async (params) => {
            if (params['route']) {
                this.LogDebug('Resubscribing to route', { 'id': params['id'], 'exchange': params['exchange'], 'route': params['route'], 'queueName': params['queueName'], 'expires': params['expires'] });
                this.ConsumeRoute(params['id'], params['exclusive'], params['durable'], params['autoDelete'], params['noAck'], params['fnHandleMessage'], params['exchange'], params['route'], params['queueName'], params['expires']);
            }
            else {
                this.LogDebug('Resubscribing to queue', { 'QueueName': params['queueName'], 'expires': params['expires'] });
                this.ConsumeQueue(params['queueName'], params['exclusive'], params['durable'], params['autoDelete'], params['noAck'], params['fnHandleMessage'], params['exchange'], params['expires']);
            }
        });
        this.subscribedRoutes.length = 0;
        while (true) {
            let m = this.offlinePubQueue.shift();
            if (!m)
                break;
            this.Publish(m[0], m[1], m[2]);
        }
    }
    async OnDisconnect() {
        this.LogDebug('OnDisconnect called', { 'stoppedByUser': this.stoppedByUser, 'lockIsBusy': this.lock.isBusy() });
        this.lock.acquire('restart', async (done) => {
            try {
                if (!this.stoppedByUser && this.connectedToStomp)
                    return;
                this.fnOnDisconnect(this.activeMessages.slice());
                this.activeMessages = [];
                if (!this.stoppedByUser) {
                    await this.Stop(false);
                }
            }
            catch (e) {
                this.LogError(`Error in OnDisconnect: ${e}`, '', {});
                setTimeout(async () => { await this.OnDisconnect(); }, 10000);
            }
            finally {
                done();
            }
        });
    }
    async Publish(exchange, routingKey, content, args = {}) {
        try {
            let route;
            if (!exchange || (exchange == ''))
                route = `/queue/${routingKey}`;
            else
                route = `/exchange/${exchange}/${routingKey}`;
            this.stompClient.send(route, args, JSON.stringify(content));
            this.LogDebug('Published message', { 'Content': util.inspect(content, false, null), 'Exchange': exchange, 'Route': route });
        }
        catch (e) {
            if (this.stoppedByUser)
                throw e;
            this.LogError('Publisher channel error: ' + e.message, e.stack, {});
            this.offlinePubQueue.push([exchange, routingKey, content]);
            this.connectedToStomp = false;
            this.OnDisconnect();
        }
    }
    async ConsumeQueue(queueName, exclusive, durable, autoDelete, noAck, fnHandleMessage, exchange, expires = 0) {
        return new Promise(async (resolve, reject) => {
            if (!queueName || (queueName == ''))
                reject('Missing or blank route parameter');
            let sub;
            try {
                if (exchange != '')
                    await this.rmqAdmin.createExchange(exchange, 'topic', false, true);
                let headers = { exclusive: exclusive, durable: durable, 'auto-delete': autoDelete, 'prefetch-count': this.prefetchCount };
                if (!noAck)
                    headers['ack'] = 'client';
                if (expires > 0)
                    headers['x-expires'] = expires;
                headers['x-queue-name'] = queueName;
                let routingKey = `/queue/${queueName}`;
                if (exchange && (exchange != ''))
                    routingKey = `/exchange/${exchange}/${queueName}`;
                sub = await this.stompClient.subscribe(routingKey, (msg) => {
                    if (msg != null) {
                        let msgKey = null;
                        try {
                            this.LogDebug('Message received', { 'Command': msg.command, 'Headers': util.inspect(msg.headers) });
                            msgKey = msg.headers['message-id'];
                            this.activeMessages.push(msgKey);
                            fnHandleMessage(JSON.parse(msg.body), msgKey, (ok, msgKey) => {
                                if (!noAck) {
                                    if (this.activeMessages.indexOf(msgKey) > -1) {
                                        try {
                                            if (ok)
                                                msg.ack();
                                            else
                                                msg.nack();
                                            SGUtils_1.SGUtils.removeItemFromArray(this.activeMessages, msgKey);
                                        }
                                        catch (e) {
                                            this.LogError('Error occurred acking Stomp message: ' + e.message, e.stack, { 'EventArgs': util.inspect(msg, false, null) });
                                        }
                                    }
                                }
                            });
                        }
                        catch (e) {
                            this.LogError('Error receiving message', e.stack, { 'QueueName': queueName });
                            if (!noAck) {
                                msg.ack();
                                if (msgKey != null)
                                    SGUtils_1.SGUtils.removeItemFromArray(this.activeMessages, msgKey);
                            }
                        }
                    }
                }, headers);
                this.subscriptions.push(sub);
                this.subscribedRoutes.push({ 'queueName': queueName, 'exclusive': exclusive, 'durable': durable, 'autoDelete': autoDelete, 'noAck': noAck, 'fnHandleMessage': fnHandleMessage, 'exchange': exchange, 'expires': expires });
                this.LogDebug('Consuming queue', { 'QueueName': queueName });
            }
            catch (e) {
                this.LogError('Error consuming Stomp queue', e.stack, { 'QueueName': queueName });
                reject(e);
            }
            resolve(sub);
        });
    }
    async ConsumeRoute(id, exclusive, durable, autoDelete, noAck, fnHandleMessage, exchange, route, queueName, expires = 0) {
        return new Promise(async (resolve, reject) => {
            if (!route || (route == ''))
                reject('Missing or blank route parameter');
            let sub;
            try {
                let headers = { exclusive: exclusive, durable: durable, 'auto-delete': autoDelete, 'prefetch-count': this.prefetchCount };
                if (!noAck)
                    headers['ack'] = 'client';
                headers['id'] = 0;
                if (id != '')
                    headers['id'] = id;
                if (expires > 0)
                    headers['x-expires'] = expires;
                if (queueName && (queueName != ''))
                    headers['x-queue-name'] = queueName;
                let routingKey = `/exchange/${exchange}/${route}`;
                sub = await this.stompClient.subscribe(routingKey, (msg) => {
                    if (msg != null) {
                        let msgKey = null;
                        try {
                            this.LogDebug('Message received', { 'Command': msg.command, 'Headers': util.inspect(msg.headers) });
                            msgKey = msg.headers['message-id'];
                            this.activeMessages.push(msgKey);
                            fnHandleMessage(JSON.parse(msg.body), msgKey, (ok, msgKey) => {
                                if (!noAck) {
                                    if (this.activeMessages.indexOf(msgKey) > -1) {
                                        try {
                                            if (ok)
                                                msg.ack();
                                            else
                                                msg.nack();
                                            SGUtils_1.SGUtils.removeItemFromArray(this.activeMessages, msgKey);
                                        }
                                        catch (e) {
                                            this.LogError('Error occurred acking Stomp message: ' + e.message, e.stack, { 'EventArgs': util.inspect(msg, false, null) });
                                        }
                                    }
                                }
                            });
                        }
                        catch (e) {
                            this.LogError('Error receiving message', e.stack, { 'QueueName': id });
                            if (!noAck) {
                                msg.ack();
                                if (msgKey != null)
                                    SGUtils_1.SGUtils.removeItemFromArray(this.activeMessages, msgKey);
                            }
                        }
                    }
                }, headers);
                this.subscribedRoutes.push({ 'id': id, 'exclusive': exclusive, 'durable': durable, 'autoDelete': autoDelete, 'noAck': noAck, 'fnHandleMessage': fnHandleMessage, 'exchange': exchange, 'route': route, 'queueName': queueName, 'expires': expires });
                this.LogDebug('Consuming route', { 'QueueName': id, 'Exchange': exchange, 'Route': route });
            }
            catch (e) {
                this.LogError('Error consuming Stomp route', e.stack, { 'QueueName': id, 'Exchange': exchange, 'Route': route });
                reject(e);
            }
            resolve(sub);
        });
    }
    async StopConsumingQueue(sub) {
        this.LogDebug('Unsubscribing', { 'Subscription': util.inspect(sub, false, null) });
        await sub.unsubscribe();
        SGUtils_1.SGUtils.removeItemFromArray(this.subscriptions, sub);
    }
    async StopConsuming() {
        try {
            while (this.subscriptions.length > 0)
                await this.StopConsumingQueue(this.subscriptions[0]);
        }
        catch (e) {
            this.LogError('Error in StopConsuming: ' + e.message, e.stack, {});
        }
    }
}
exports.StompConnector = StompConnector;
//# sourceMappingURL=StompLib.js.map