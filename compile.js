"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = require("module");
const util_1 = require("util");
const path_1 = __importDefault(require("path"));
const _1 = require(".");
const definition_1 = require("./definition");
const { promises: fs, constants: { R_OK: READ_ACCESS } } = require('fs');
const log = require('simple-node-logger').createSimpleLogger({
    timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
});
log.setLevel(process.env.LOG_LEVEL || 'info');
async function compile(compilerDesc, sourceDir, outputFile) {
    sourceDir = path_1.default.resolve(sourceDir);
    outputFile = path_1.default.resolve(outputFile);
    log.info('Compiling app at ', sourceDir);
    const sourceAppManifest = path_1.default.format({ dir: sourceDir, base: 'app.json' });
    try {
        log.debug('Checking access to app\'s source folder');
        await fs.access(sourceAppManifest, READ_ACCESS);
    }
    catch (error) {
        log.error(`Can't read app's manifest in "${sourceAppManifest}". Are you sure there is an app there?`);
        throw new definition_1.CompilerFileNotFoundError(sourceAppManifest);
    }
    const appRequire = module_1.createRequire(sourceAppManifest);
    log.debug('Created require function for the app\'s folder scope');
    let appTs;
    try {
        appTs = appRequire('typescript');
        log.debug(`Using TypeScript ${appTs.version} as specified in app's dependencies`);
    }
    catch {
        log.debug("App doesn't have the typescript package as a dependency - compiler will fall back to TypeScript 2.9.2");
    }
    try {
        const compiler = new _1.AppsCompiler(compilerDesc, appTs);
        log.debug('Starting compilation...');
        const result = await compiler.compile(sourceDir);
        if (result.diagnostics.length) {
            return result;
        }
        log.debug('Compilation complete, inspection \n', util_1.inspect(result));
        log.debug('Starting packaging...');
        await compiler.outputZip(outputFile);
        log.info(`Compilation successful! Took ${result.duration / 1000}s. Package saved at `, outputFile);
        return result;
    }
    catch (error) {
        log.error('Compilation was unsuccessful');
        throw error;
    }
}
exports.compile = compile;
