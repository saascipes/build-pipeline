"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SGUtils {
    static removeItemFromArray(array, item) {
        const index = array.indexOf(item);
        if (index > -1)
            array.splice(index, 1);
    }
    static async sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
}
exports.SGUtils = SGUtils;
//# sourceMappingURL=SGUtils.js.map