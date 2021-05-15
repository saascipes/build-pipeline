"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const typegoose_1 = require("@typegoose/typegoose");
const BulkGet_1 = require("../utils/BulkGet");
const mongodb = require("mongodb");
// Example of a schema / domain in Mongoose
let StockSubscriptionSchema = class StockSubscriptionSchema {
};
// Define which filters are legal for which props (including nested props (not sure about nested arrays))
StockSubscriptionSchema.validFilters = {
    'ticker': [BulkGet_1.FilterOperator.LIKE]
};
// 2 way map between field values the API client sees and what is stored in the database.  Allows client to use 'id' and database to use '_id'
StockSubscriptionSchema.propAliases = {
    '_id': 'id',
    'id': '_id',
    '__v': 'version'
};
// Converters for values to/from the database.  Converter functions take the entire model
StockSubscriptionSchema.dataConverters = {
    // This isn't hooked up yet until needed - if it does, then call this in the controller layer on data before passing to service
    toDB: {
    // _originalAuthorUserId: (data) => {
    //   return new mongodb.ObjectID(data._originalAuthorUserId);
    // },
    // _lastEditedUserId: (data) => {
    //   return new mongodb.ObjectID(data._lastEditedUserId);
    // }
    },
    fromDB: {
    // _originalAuthorUserId: (data) => {
    //   return new mongodb.ObjectID(data._originalAuthorUserId);
    // },
    // _lastEditedUserId: (data) => {
    //   return new mongodb.ObjectID(data._lastEditedUserId);
    // }
    }
};
__decorate([
    typegoose_1.prop(),
    __metadata("design:type", typeof (_a = typeof mongodb !== "undefined" && mongodb.ObjectId) === "function" ? _a : Object)
], StockSubscriptionSchema.prototype, "id", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", String)
], StockSubscriptionSchema.prototype, "ticker", void 0);
__decorate([
    typegoose_1.prop({ required: true }),
    __metadata("design:type", Number)
], StockSubscriptionSchema.prototype, "expires", void 0);
StockSubscriptionSchema = __decorate([
    typegoose_1.modelOptions({ schemaOptions: { collection: 'stockSubscription' } })
], StockSubscriptionSchema);
exports.StockSubscriptionSchema = StockSubscriptionSchema;
;
exports.StockSubscriptionModel = typegoose_1.getModelForClass(StockSubscriptionSchema);
//# sourceMappingURL=StockSubscription.js.map