"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const figures = __importStar(require("figures"));
const fs = __importStar(require("fs-extra"));
const tv4 = __importStar(require("tv4"));
const appJsonSchema_1 = require("./appJsonSchema");
class FolderDetails {
    constructor(folder) {
        this.folder = folder;
        this.toZip = path.join(this.folder, '{,!(node_modules|test)/**/}*.*');
        this.infoFile = path.join(this.folder, 'app.json');
        this.mainFile = '';
        this.info = {};
    }
    async doesFileExist(file) {
        return await fs.pathExists(file) && fs.statSync(file).isFile();
    }
    mergeWithFolder(item) {
        return path.join(this.folder, item);
    }
    setAppInfo(appInfo) {
        this.info = appInfo;
    }
    async readInfoFile() {
        if (!await this.doesFileExist(this.infoFile)) {
            throw new Error('No App found to package. Missing an "app.json" file.');
        }
        try {
            this.info = JSON.parse(fs.readFileSync(this.infoFile, { encoding: 'utf-8' }));
        }
        catch (e) {
            throw new Error('The "app.json" file is invalid.');
        }
        this.validateAppManifest();
        if (!this.info.classFile) {
            throw new Error('Invalid "app.json" file. The "classFile" is required.');
        }
        this.mainFile = path.join(this.folder, this.info.classFile);
        if (!await this.doesFileExist(this.mainFile)) {
            throw new Error(`The specified classFile (${this.mainFile}) does not exist.`);
        }
    }
    validateAppManifest() {
        const result = tv4.validateMultiple(this.info, appJsonSchema_1.appJsonSchema);
        if (!this.isValidResult(result)) {
            this.reportFailed(result.errors.length, result.missing.length);
            result.errors.forEach((e) => this.reportError(e));
            result.missing.forEach((v) => this.reportMissing(v));
            throw new Error('Invalid "app.json" file, please ensure it matches the schema. (TODO: insert link here)');
        }
    }
    isValidResult(result) {
        return result.valid && result.missing.length === 0;
    }
    reportFailed(errorCount, missingCount) {
        const results = [];
        if (errorCount > 0) {
            results.push(chalk_1.default.red(`${errorCount} validation error(s)`));
        }
        if (missingCount > 0) {
            results.push(chalk_1.default.red(`${missingCount} missing schema(s)`));
        }
        console.log(chalk_1.default.red(figures.cross), chalk_1.default.cyan(this.infoFile), results.length > 0 ? `has ${results.join(' and ')}` : '');
    }
    reportError(error, indent = '  ') {
        console.log(indent, chalk_1.default.red(`${figures.pointerSmall} Error:`), error.message || 'No error message provided by validation module');
        console.log(indent, '  at', chalk_1.default.blue(error.dataPath || '/'), 'against schema', chalk_1.default.blue(error.schemaPath || '/'));
        if (error.subErrors) {
            error.subErrors.forEach((err) => this.reportError(err, `${indent}  `));
        }
    }
    reportMissing(uri, indent = '  ') {
        console.log(indent, chalk_1.default.red(`${figures.pointerSmall} Missing:`), uri);
    }
}
exports.FolderDetails = FolderDetails;
