"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const aws = require("aws-sdk");
const config = require("config");
const _ = require("lodash");
const s3 = new aws.S3({
    credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY')
    },
    region: config.get('AWS_REGION')
});
class S3Access {
    constructor() { }
    async uploadFileToS3(filePath, s3Path, bucket) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err)
                    reject(err);
                // const s3Path = `${uniqueId}/${path.basename(filePath)}`;
                const params = {
                    Bucket: bucket,
                    Key: s3Path,
                    Body: data
                };
                // let options = {partSize: 10 * 1024 * 1024, queueSize: 1};
                let options = {};
                s3.upload(params, options, (s3Err, data) => {
                    if (s3Err)
                        reject(s3Err);
                    resolve(`File uploaded successfully to ${data.Location}`);
                });
            });
        });
    }
    async deleteFileFromS3(s3Path, bucket) {
        return new Promise((resolve, reject) => {
            if (!this.objectExists(s3Path, bucket)) {
                resolve();
                return;
            }
            const params = {
                Bucket: bucket,
                Key: s3Path
            };
            s3.deleteObject(params, (s3Err, data) => {
                if (s3Err)
                    reject(s3Err);
                resolve();
            });
        });
    }
    async getSignedS3URL(s3FilePath, bucket) {
        const params = { Bucket: bucket, Key: s3FilePath, Expires: parseInt(config.get('S3_URL_EXPIRATION_SECONDS'), 10) };
        return s3.getSignedUrl('getObject', params);
    }
    async putSignedS3URL(s3FilePath, bucket, contentType) {
        const params = { Bucket: bucket, Key: s3FilePath, Expires: parseInt(config.get('S3_URL_EXPIRATION_SECONDS'), 10), ContentType: contentType };
        return s3.getSignedUrl('putObject', params);
    }
    async objectExists(s3FilePath, bucket) {
        const params = {
            Bucket: bucket,
            Key: s3FilePath
        };
        return new Promise((resolve, reject) => {
            s3.headObject(params, async (err, data) => {
                if (err) {
                    if (err.code == 'NotFound') {
                        resolve(false);
                    }
                    else {
                        reject(err);
                    }
                }
                else {
                    resolve(true);
                }
            });
        });
    }
    async sizeOf(prefix, bucket, size = 0, token = undefined) {
        const params = {
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: 2
        };
        if (token)
            params.ContinuationToken = token;
        return new Promise((resolve, reject) => {
            s3.listObjectsV2(params, async (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    // console.log(JSON.stringify(data, null, 4));
                    if (_.isArray(data.Contents) && data.Contents.length > 0) {
                        for (let i = 0; i < data.Contents.length; i++) {
                            console.log(`${data.Contents[i].Key} - ${data.Contents[i].Size}`);
                            size += data.Contents[i].Size;
                        }
                    }
                    if (data.IsTruncated) {
                        size = await this.sizeOf(prefix, bucket, size, data.NextContinuationToken);
                    }
                    resolve(size);
                }
            });
        });
    }
}
exports.S3Access = S3Access;
//# sourceMappingURL=S3Access.js.map