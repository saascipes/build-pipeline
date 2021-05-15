"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const compression = require('compression');
const config = require("config");
const SGLogger_1 = require("../shared/SGLogger");
const mongoose = require("mongoose");
const StockSubscriptionRouter_1 = require("./routes/StockSubscriptionRouter");
const ErrorMiddleware_1 = require("./utils/ErrorMiddleware");
const ResponseMiddleware_1 = require("./utils/ResponseMiddleware");
// Create a new express application instance
const app = express();
const appName = 'SaasGlue Demo - Build Pipeline';
const environment = process.env.NODE_ENV || 'development';
var options = {
    autoIndex: false,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 500,
    poolSize: 10,
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    useNewUrlParser: true
};
mongoose.connect(config.get('mongoUrl'), options);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
class AppBuilder {
    constructor(app) {
        this.app = app;
        this.setUpMiddleware();
        this.setUpRoutes();
        app.use(ErrorMiddleware_1.handleErrors);
        app.use(ResponseMiddleware_1.handleResponse);
    }
    setUpMiddleware() {
        app.disable('etag');
        app.use(ResponseMiddleware_1.handleBuildResponseWrapper);
        // app.use(handleStartTimer);
        this.setUpClient();
        this.setUpLogger();
    }
    setUpClient() {
        // setup gzip / deflate for static resources and REST api responses
        app.use(compression({
            filter: (req, resp) => {
                if (req.headers['x-no-compression']) {
                    return false;
                }
                else {
                    return true;
                }
            }
        }));
        app.use(express.static(path.join(__dirname, '../../../clientv1/dist')));
    }
    setUpLogger() {
        let logger = new SGLogger_1.BaseLogger(appName);
        logger.Start();
        this.app.use((req, res, next) => {
            req.logger = logger;
            next();
        });
    }
    setUpRoutes() {
        const apiURLBase = '/api/v0';
        this.app.use(`${apiURLBase}/subscription`, StockSubscriptionRouter_1.stockSubscriptionRouter);
    }
}
new AppBuilder(app);
const port = process.env.PORT || 3000;
const server = app.listen(port, function () {
    console.log(`API listening on port ${port}!`);
});
exports.default = server;
//# sourceMappingURL=StartServer.js.map