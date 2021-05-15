"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ResponseCode;
(function (ResponseCode) {
    ResponseCode[ResponseCode["OK"] = 200] = "OK";
    ResponseCode[ResponseCode["CREATED"] = 201] = "CREATED";
    ResponseCode[ResponseCode["NOT_AVAILABLE"] = 303] = "NOT_AVAILABLE";
    ResponseCode[ResponseCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    ResponseCode[ResponseCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    ResponseCode[ResponseCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    ResponseCode[ResponseCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    ResponseCode[ResponseCode["UNEXPECTED_ERROR"] = 500] = "UNEXPECTED_ERROR";
})(ResponseCode = exports.ResponseCode || (exports.ResponseCode = {}));
;
class ResponseWrapper {
    constructor() {
        this.statusCode = 200;
    }
}
exports.ResponseWrapper = ResponseWrapper;
;
//# sourceMappingURL=Types.js.map