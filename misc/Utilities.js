"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const cloneDeep = require("lodash.clonedeep");
var AllowedInternalModules;
(function (AllowedInternalModules) {
    AllowedInternalModules[AllowedInternalModules["path"] = 0] = "path";
    AllowedInternalModules[AllowedInternalModules["url"] = 1] = "url";
    AllowedInternalModules[AllowedInternalModules["crypto"] = 2] = "crypto";
    AllowedInternalModules[AllowedInternalModules["buffer"] = 3] = "buffer";
    AllowedInternalModules[AllowedInternalModules["fs"] = 4] = "fs";
    AllowedInternalModules[AllowedInternalModules["events"] = 5] = "events";
    AllowedInternalModules[AllowedInternalModules["stream"] = 6] = "stream";
    AllowedInternalModules[AllowedInternalModules["net"] = 7] = "net";
})(AllowedInternalModules || (AllowedInternalModules = {}));
class Utilities {
    static deepClone(item) {
        return cloneDeep(item);
    }
    static deepFreeze(item) {
        Object.freeze(item);
        Object.getOwnPropertyNames(item).forEach((prop) => {
            if (item.hasOwnProperty(prop) && item[prop] !== null && (typeof item[prop] === 'object' || typeof item[prop] === 'function') && !Object.isFrozen(item[prop])) {
                Utilities.deepFreeze(item[prop]);
            }
        });
        return item;
    }
    static deepCloneAndFreeze(item) {
        return Utilities.deepFreeze(Utilities.deepClone(item));
    }
    static allowedInternalModuleRequire(moduleName) {
        return moduleName in AllowedInternalModules;
    }
    static transformModuleForCustomRequire(moduleName) {
        return `${path.normalize(moduleName).replace(/\.\.?\//g, '').replace(/^\//, '')}.ts`;
    }
}
exports.Utilities = Utilities;
