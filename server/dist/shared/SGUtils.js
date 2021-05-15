"use strict";
// import * as os from 'os';
// import { exec } from 'child_process';
// import { SGStrings } from './SGStrings';
// import { TaskDefSchema } from '../api/domain/TaskDef';
// import { teamService } from '../api/services/TeamService';
// import { jobService } from '../api/services/JobService';
// import { taskService } from '../api/services/TaskService';
// import { taskOutcomeService } from '../api/services/TaskOutcomeService';
// import { TeamSchema } from '../api/domain/Team';
// import { InvoiceSchema } from '../api/domain/Invoice';
// import { JobSchema } from '../api/domain/Job';
// import { teamVariableService } from '../api/services/TeamVariableService';
// import { BaseLogger } from './SGLogger';
// import { S3Access } from './S3Access';
// import * as mongodb from 'mongodb';
// import * as fs from 'fs';
// import * as pdf from 'html-pdf';
// import * as moment from 'moment';
// import * as compressing from 'compressing';
// import * as config from 'config';
// import { MissingObjectError, ValidationError } from '../api/utils/Errors';
// import * as _ from 'lodash';
// import * as Enums from './Enums';
// import axios from 'axios';
// import { scriptService } from '../api/services/ScriptService';
// import { ScriptSchema } from '../api/domain/Script';
// import { MongoDbSettings } from 'aws-sdk/clients/dms';
Object.defineProperty(exports, "__esModule", { value: true });
// const ascii2utf8: any = {
//     '0': '30',
//     '1': '31',
//     '2': '32',
//     '3': '33',
//     '4': '34',
//     '5': '35',
//     '6': '36',
//     '7': '37',
//     '8': '38',
//     '9': '39'
// }
// const base64EncodedEmailTemplate = `To: {to_address}
// Subject: {subject}
// Reply-To: {reply_to}
// From: {from}
// Auto-Submitted: auto-generated
// MIME-Version: 1.0
// Content-Type: multipart/alternative; boundary="{boundary_id}"
// --{boundary_id}
// Content-Type: text/plain; charset="utf-8"
// Content-Transfer-Encoding: base64
// Content-Disposition: inline
// {content_text}
// --{boundary_id}
// Content-Type: text/html; charset="utf-8"
// Content-Transfer-Encoding: base64
// Content-Disposition: inline
// {content_html}
// --{boundary_id}--
// `;
class SGUtils {
    //     static concat = (x, y) =>
    //         x.concat(y)
    //     static flatMap = (f, xs) =>
    //         xs.map(f).reduce(SGUtils.concat, [])
    //     static btoa(str: string) {
    //         return Buffer.from(str).toString('base64');
    //     }
    //     static atob(b64Encoded: string) {
    //         return Buffer.from(b64Encoded, 'base64').toString('utf8');
    //     }
    //     static makeid(len: number = 5, lettersOnly: boolean = false) {
    //         var text = "";
    //         var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    //         if (!lettersOnly)
    //             possible += "0123456789";
    //         for (var i = 0; i < len; i++)
    //             text += possible.charAt(Math.floor(Math.random() * possible.length));
    //         return text;
    //     }
    //     static makeNumericId(len: number = 6) {
    //         var text = "";
    //         let possible = "0123456789";
    //         for (let i = 0; i < len; i++)
    //             text += possible.charAt(Math.floor(Math.random() * possible.length));
    //         return text;
    //     }
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