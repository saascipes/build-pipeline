"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MissingObjectError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MissingObjectError';
    }
}
exports.MissingObjectError = MissingObjectError;
class FreeTierLimitExceededError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FreeTierLimitExceededError';
    }
}
exports.FreeTierLimitExceededError = FreeTierLimitExceededError;
class ValidationError extends Error {
    constructor(message, path) {
        super(message);
        this.name = 'Validation Error';
        this.path = path;
    }
    getPath() {
        return this.path;
    }
}
exports.ValidationError = ValidationError;
class ForbiddenError extends Error {
    constructor(message, path) {
        super(message);
        this.name = 'Forbidden';
        this.path = path;
    }
    getPath() {
        return this.path;
    }
}
exports.ForbiddenError = ForbiddenError;
//# sourceMappingURL=Errors.js.map