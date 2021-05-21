"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
class RabbitMQAdmin {
    constructor(url, vhost, logger = null) {
        // if (logger) {
        //     logger.LogDebug('Instantiating RabbitMQAdmin class', { 'Url': url });
        // }
        this.url = url;
        this.vhost = vhost;
        this.logger = logger;
        this.instance = axios_1.default.create({
            baseURL: url,
            timeout: 30000
        });
    }
    async getQueues(matchStr) {
        return new Promise((resolve, reject) => {
            this.instance.get(`queues/${this.vhost}`)
                .then((response) => {
                if (!response.data)
                    resolve('');
                let queues = [];
                for (let i = 0; i < response.data.length; i++) {
                    if (response.data[i].name.match(matchStr))
                        queues.push(response.data[i].name);
                }
                resolve(queues);
            })
                .catch((err) => {
                reject(new Error(`Error getting queues matching '${matchStr}': ${err}`));
            });
        });
    }
    async getExchanges(matchStr) {
        return new Promise((resolve, reject) => {
            this.instance.get(`exchanges/${this.vhost}`)
                .then((response) => {
                if (!response.data)
                    resolve('');
                let exchanges = [];
                for (let i = 0; i < response.data.length; i++) {
                    if (response.data[i].name.match(matchStr))
                        exchanges.push(response.data[i].name);
                }
                resolve(exchanges);
            })
                .catch((err) => {
                reject(new Error(`Error getting exchanges matching '${matchStr}': ${err}`));
            });
        });
    }
    async getQueueDetails(queue) {
        return new Promise((resolve, reject) => {
            this.instance.get(`queues/${this.vhost}/${queue}`)
                .then((response) => {
                resolve(response);
            })
                .catch((err) => {
                resolve();
            });
        });
    }
    async purgeQueue(queue) {
        return new Promise((resolve, reject) => {
            this.instance.delete(`queues/${this.vhost}/${queue}/contents`)
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(err);
            });
        });
    }
    async deleteQueue(queue) {
        return new Promise((resolve, reject) => {
            this.instance.delete(`queues/${this.vhost}/${queue}`)
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error deleting queue '${queue}': ${err}`));
            });
        });
    }
    async createQueue(queue, autoDelete, durable, expires = 0) {
        return new Promise((resolve, reject) => {
            let args = { 'auto-delete': autoDelete, 'durable': durable };
            if (expires > 0)
                Object.assign(args, { 'arguments': { 'x-expires': expires } });
            this.instance.put(`queues/${this.vhost}/${queue}`, args)
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error creating queue '${queue}': ${err}`));
            });
        });
    }
    async createExchange(exchange, type, autoDelete, durable) {
        return new Promise((resolve, reject) => {
            this.instance.put(`exchanges/${this.vhost}/${exchange}`, { 'type': type, 'auto-delete': autoDelete, 'durable': durable })
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error creating exchange '${exchange}': ${err}`));
            });
        });
    }
    async bindExchanges(source, destination, routingKey) {
        return new Promise((resolve, reject) => {
            this.instance.post(`bindings/${this.vhost}/e/${source}/e/${destination}`, { 'routing_key': routingKey })
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error binding exchange '${source}" to "${destination}" with route "${routingKey}': ${err}`));
            });
        });
    }
    async bindQueueToExchange(exchange, queue, routingKey) {
        return new Promise((resolve, reject) => {
            this.instance.post(`bindings/${this.vhost}/e/${exchange}/q/${queue}`, { 'routing_key': routingKey })
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error binding queue '${queue}" to exchange "${exchange}" with route "${routingKey}': ${err}`));
            });
        });
    }
    async deleteExchange(exchange) {
        return new Promise((resolve, reject) => {
            this.instance.delete(`exchanges/${this.vhost}/${exchange}`)
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error deleting exchange '${exchange}': ${err}`));
            });
        });
    }
    async createUser(userName, password, exchange, tags = 'administrator') {
        return new Promise((resolve, reject) => {
            let body = { 'password': password, 'tags': tags };
            this.instance.put(`users/${userName}`, body)
                .then((response) => {
                this.instance.put(`permissions/${this.vhost}/${userName}`, { 'configure': `^${exchange}.*`, 'write': `^${exchange}.*`, 'read': `^${exchange}.*` })
                    .then((response) => {
                    this.instance.put(`topic-permissions/${this.vhost}/${userName}`, { 'exchange': exchange, 'write': '.*', 'read': '.*' })
                        .then((response) => {
                        resolve(response.status);
                    })
                        .catch((err) => {
                        reject(new Error(`Error setting '${userName}" permissions for exchange "${exchange}': ${err}`));
                    });
                })
                    .catch((err) => {
                    reject(new Error(`Error setting '${userName}' permissions: ${err}`));
                });
            })
                .catch((err) => {
                reject(new Error(`Error creating user '${userName}': ${err}`));
            });
        });
    }
    async setUserPermission(userName, exchange, regexWrite, regexRead) {
        return new Promise((resolve, reject) => {
            this.instance.put(`topic-permissions/${this.vhost}/${userName}`, { 'exchange': exchange, 'write': regexWrite, 'read': regexRead })
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error setting '${userName}" permissions for exchange "${exchange}': ${err}`));
            });
        });
    }
    async getUsers(matchStr) {
        return new Promise((resolve, reject) => {
            this.instance.get(`users`)
                .then((response) => {
                if (!response.data)
                    resolve('');
                let users = [];
                for (let i = 0; i < response.data.length; i++) {
                    if (response.data[i].name.match(matchStr))
                        users.push(response.data[i].name);
                }
                resolve(users);
            })
                .catch((err) => {
                reject(new Error(`Error getting users matching '${matchStr}': ${err}`));
            });
        });
    }
    async deleteUser(userName) {
        const user = await this.getUsers(userName);
        if (user.length < 1)
            return;
        return new Promise((resolve, reject) => {
            this.instance.delete(`users/${userName}`)
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error deleting user '${userName}': ${err}`));
            });
        });
    }
    async setPolicy(policyName, pattern, definition, applyTo = 'all', priority = 0) {
        return new Promise((resolve, reject) => {
            this.instance.put(`policies/${this.vhost}/${policyName}`, { 'pattern': pattern, 'definition': definition, 'priority': priority, 'apply-to': applyTo })
                .then((response) => {
                resolve(response.status);
            })
                .catch((err) => {
                reject(new Error(`Error creating policy '${policyName}': ${err}`));
            });
        });
    }
}
exports.RabbitMQAdmin = RabbitMQAdmin;
//# sourceMappingURL=RabbitMQAdmin.js.map