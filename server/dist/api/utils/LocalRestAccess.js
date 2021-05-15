"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const config = require("config");
class LocalRestAccess {
    async RestAPICall(url, method, _teamId, headers = {}, data = {}, token = undefined) {
        return new Promise(async (resolve, reject) => {
            try {
                let authToken = token;
                if (!authToken) {
                    authToken = `${config.get('adminToken')};`;
                }
                let apiUrl = config.get('API_BASE_URL');
                const apiVersion = config.get('API_VERSION');
                const apiPort = config.get('API_PORT');
                if (apiPort != '')
                    apiUrl += `:${apiPort}`;
                url = `${apiUrl}/api/${apiVersion}/${url}`;
                const combinedHeaders = Object.assign({
                    Cookie: `Auth=${authToken}`,
                    _teamId: _teamId
                }, headers);
                // console.log('RestAPICall -> url ', url, ', method -> ', method, ', headers -> ', combinedHeaders, ', data -> ', data, ', token -> ', this.token);
                const response = await axios_1.default({
                    url,
                    method: method,
                    responseType: 'text',
                    headers: combinedHeaders,
                    data: data
                });
                resolve(response);
            }
            catch (e) {
                e.message = `RestAPICall error occurred calling ${method} on '${url}': ${e.message}`;
                reject(e);
            }
        });
    }
}
exports.localRestAccess = new LocalRestAccess();
//# sourceMappingURL=LocalRestAccess.js.map