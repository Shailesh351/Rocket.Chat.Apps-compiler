"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const vm = __importStar(require("vm"));
const path = __importStar(require("path"));
const fallbackTypescript = __importStar(require("typescript"));
const module_1 = require("module");
const getAppSource_1 = require("./compiler/getAppSource");
const Utilities_1 = require("./misc/Utilities");
const folderDetails_1 = require("./misc/folderDetails");
const appPackager_1 = require("./misc/appPackager");
const getAvailablePermissions_1 = require("./misc/getAvailablePermissions");
class AppsCompiler {
    constructor(compilerDesc, ts = fallbackTypescript) {
        this.compilerDesc = compilerDesc;
        this.ts = ts;
        this.compilerOptions = {
            target: this.ts.ScriptTarget.ES2017,
            module: this.ts.ModuleKind.CommonJS,
            moduleResolution: this.ts.ModuleResolutionKind.NodeJs,
            declaration: false,
            noImplicitAny: false,
            removeComments: true,
            strictNullChecks: true,
            noImplicitReturns: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            types: ['node'],
            traceResolution: false,
        };
        this.libraryFiles = {};
    }
    get appRequire() {
        return this._appRequire;
    }
    async compile(path) {
        this.wd = path;
        this._appRequire = module_1.createRequire(`${path}/app.json`);
        const source = await getAppSource_1.getAppSource(path);
        this.validateAppPermissionsSchema(source.appInfo.permissions);
        const compilerResult = this.toJs(source);
        const { files, implemented } = compilerResult;
        const { permissions } = source.appInfo;
        this.validateAppPermissionsSchema(permissions);
        this.compiled = Object.entries(files)
            .map(([, { name, compiled }]) => ({ [name]: compiled }))
            .reduce((acc, cur) => Object.assign(acc, cur), {});
        this.implemented = implemented;
        this.checkInheritance(source.appInfo.classFile.replace(/\.ts$/, ''));
        return Object.assign(compilerResult, { permissions });
    }
    output() {
        return this.compiled;
    }
    getImplemented() {
        return this.implemented;
    }
    async outputZip(outputPath) {
        const fd = new folderDetails_1.FolderDetails(this.wd);
        try {
            await fd.readInfoFile();
        }
        catch (e) {
            console.error(e && e.message ? e.message : e);
            return;
        }
        const packager = new appPackager_1.AppPackager(this.compilerDesc, fd, this, outputPath);
        return fs.promises.readFile(await packager.zipItUp());
    }
    validateAppPermissionsSchema(permissions) {
        if (!permissions) {
            return;
        }
        if (!Array.isArray(permissions)) {
            throw new Error('Invalid permission definition. Check your manifest file.');
        }
        const permissionsRequire = this.appRequire('@rocket.chat/apps-engine/server/permissions/AppPermissions');
        if (!permissionsRequire || !permissionsRequire.AppPermissions) {
            return;
        }
        const availablePermissions = getAvailablePermissions_1.getAvailablePermissions(permissionsRequire.AppPermissions);
        permissions.forEach((permission) => {
            if (permission && !availablePermissions.includes(permission.name)) {
                throw new Error(`Invalid permission "${String(permission.name)}" defined. Check your manifest file`);
            }
        });
    }
    toJs({ appInfo, sourceFiles: files }) {
        if (!appInfo.classFile || !files[appInfo.classFile] || !this.isValidFile(files[appInfo.classFile])) {
            throw new Error(`Invalid App package. Could not find the classFile (${appInfo.classFile}) file.`);
        }
        const startTime = Date.now();
        const result = {
            files,
            implemented: [],
            diagnostics: [],
            duration: NaN,
            name: appInfo.name,
            version: appInfo.version,
            typeScriptVersion: this.ts.version,
        };
        Object.keys(result.files).forEach((key) => {
            if (!this.isValidFile(result.files[key])) {
                throw new Error(`Invalid TypeScript file: "${key}".`);
            }
            result.files[key].name = path.normalize(result.files[key].name);
        });
        const modulesNotFound = [];
        const host = {
            getScriptFileNames: () => Object.keys(result.files),
            getScriptVersion: (fileName) => {
                fileName = path.normalize(fileName);
                const file = result.files[fileName] || this.getLibraryFile(fileName);
                return file && file.version.toString();
            },
            getScriptSnapshot: (fileName) => {
                fileName = path.normalize(fileName);
                const file = result.files[fileName] || this.getLibraryFile(fileName);
                if (!file || !file.content) {
                    return;
                }
                return this.ts.ScriptSnapshot.fromString(file.content);
            },
            getCompilationSettings: () => this.compilerOptions,
            getCurrentDirectory: () => this.wd,
            getDefaultLibFileName: () => this.ts.getDefaultLibFilePath(this.compilerOptions),
            fileExists: (fileName) => this.ts.sys.fileExists(fileName),
            readFile: (fileName) => this.ts.sys.readFile(fileName),
            resolveModuleNames: (moduleNames, containingFile) => {
                const resolvedModules = [];
                const moduleResHost = {
                    fileExists: host.fileExists, readFile: host.readFile, trace: (traceDetail) => console.log(traceDetail),
                };
                for (const moduleName of moduleNames) {
                    const index = this.resolver(moduleName, resolvedModules, containingFile, result, this.wd, moduleResHost);
                    if (index === -1) {
                        modulesNotFound.push({
                            filename: containingFile,
                            line: 0,
                            character: 0,
                            lineText: '',
                            message: `Failed to resolve module: ${moduleName}`,
                            originalMessage: `Module not found: ${moduleName}`,
                            originalDiagnostic: undefined,
                        });
                    }
                }
                return resolvedModules;
            },
        };
        const languageService = this.ts.createLanguageService(host, this.ts.createDocumentRegistry());
        try {
            const coDiag = languageService.getCompilerOptionsDiagnostics();
            if (coDiag.length !== 0) {
                console.log(coDiag);
                console.error('A VERY UNEXPECTED ERROR HAPPENED THAT SHOULD NOT!');
                throw new Error(`Language Service's Compiler Options Diagnostics contains ${coDiag.length} diagnostics.`);
            }
        }
        catch (e) {
            if (modulesNotFound.length !== 0) {
                result.diagnostics = modulesNotFound;
                result.duration = Date.now() - startTime;
                return result;
            }
            throw e;
        }
        const src = languageService.getProgram().getSourceFile(appInfo.classFile);
        this.ts.forEachChild(src, (n) => {
            if (!this.ts.isClassDeclaration(n))
                return;
            this.ts.forEachChild(n, (node) => {
                if (this.ts.isHeritageClause(node)) {
                    const e = node;
                    this.ts.forEachChild(node, (nn) => {
                        if (e.token === this.ts.SyntaxKind.ImplementsKeyword) {
                            result.implemented.push(nn.getText());
                        }
                    });
                }
            });
        });
        Object.defineProperty(result, 'diagnostics', {
            value: this.normalizeDiagnostics(this.ts.getPreEmitDiagnostics(languageService.getProgram())),
            configurable: false,
            writable: false,
        });
        Object.keys(result.files).forEach((key) => {
            const file = result.files[key];
            const output = languageService.getEmitOutput(file.name);
            file.name = key.replace(/\.ts/g, '.js');
            delete result.files[key];
            result.files[file.name] = file;
            file.compiled = output.outputFiles[0].text;
        });
        result.duration = Date.now() - startTime;
        return result;
    }
    normalizeDiagnostics(diagnostics) {
        return diagnostics.map((diag) => {
            const message = this.ts.flattenDiagnosticMessageText(diag.messageText, '\n');
            const norm = {
                originalDiagnostic: diag,
                originalMessage: message,
                message,
            };
            Object.defineProperties(norm, {
                originalDiagnostic: { enumerable: false },
            });
            if (diag.file) {
                const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
                const lineStart = diag.file.getPositionOfLineAndCharacter(line, 0);
                Object.assign(norm, {
                    filename: diag.file.fileName,
                    line,
                    character,
                    lineText: diag.file.getText().substring(lineStart, diag.file.getLineEndOfPosition(lineStart)),
                    message: `Error ${diag.file.fileName} (${line + 1},${character + 1}): ${message}`,
                });
            }
            return norm;
        });
    }
    resolvePath(containingFile, moduleName, cwd) {
        const currentFolderPath = path.dirname(containingFile).replace(cwd.replace(/\/$/, ''), '');
        const modulePath = path.join(currentFolderPath, moduleName);
        const transformedModule = Utilities_1.Utilities.transformModuleForCustomRequire(modulePath);
        if (transformedModule) {
            return transformedModule;
        }
    }
    resolver(moduleName, resolvedModules, containingFile, result, cwd, moduleResHost) {
        moduleName = moduleName.replace(/@rocket.chat\/apps-ts-definition\//, '@rocket.chat/apps-engine/definition/');
        if (/node_modules\/@types\/node\/\S+\.d\.ts$/.test(containingFile)) {
            return resolvedModules.push(undefined);
        }
        if (Utilities_1.Utilities.allowedInternalModuleRequire(moduleName)) {
            return resolvedModules.push({ resolvedFileName: `${moduleName}.js` });
        }
        const resolvedPath = this.resolvePath(containingFile, moduleName, cwd);
        if (result.files[resolvedPath]) {
            return resolvedModules.push({ resolvedFileName: resolvedPath });
        }
        const rs = this.ts.resolveModuleName(moduleName, containingFile, this.compilerOptions, moduleResHost);
        if (rs.resolvedModule) {
            return resolvedModules.push(rs.resolvedModule);
        }
        return -1;
    }
    getLibraryFile(fileName) {
        if (!fileName.endsWith('.d.ts')) {
            return undefined;
        }
        const norm = path.normalize(fileName);
        if (this.libraryFiles[norm]) {
            return this.libraryFiles[norm];
        }
        if (!fs.existsSync(fileName)) {
            return undefined;
        }
        this.libraryFiles[norm] = {
            name: norm,
            content: fs.readFileSync(fileName).toString(),
            version: 0,
        };
        return this.libraryFiles[norm];
    }
    checkInheritance(mainClassFile) {
        const { App: EngineBaseApp } = this.appRequire('@rocket.chat/apps-engine/definition/App');
        const mainClassModule = this.requireCompiled(mainClassFile);
        if (!mainClassModule.default && !mainClassModule[mainClassFile]) {
            throw new Error(`There must be an exported class "${mainClassFile}" or a default export in the main class file.`);
        }
        const RealApp = mainClassModule.default ? mainClassModule.default : mainClassModule[mainClassFile];
        const mockInfo = { name: '', requiredApiVersion: '', author: { name: '' } };
        const mockLogger = { debug: () => { } };
        const realApp = new RealApp(mockInfo, mockLogger);
        if (!(realApp instanceof EngineBaseApp)) {
            throw new Error('App must extend apps-engine\'s "App" abstract class.'
                + ' Maybe you forgot to install dependencies? Try running `npm install`'
                + ' in your app folder to fix it.');
        }
    }
    requireCompiled(filename) {
        const exports = {};
        const context = vm.createContext({
            require: (filepath) => {
                if (filepath.startsWith('@rocket.chat/apps-engine/definition/')) {
                    return require(`${this.wd}/node_modules/${filepath}`);
                }
                if (Utilities_1.Utilities.allowedInternalModuleRequire(filepath)) {
                    return require(filepath);
                }
                if (!filepath.startsWith('.')) {
                    return undefined;
                }
                filepath = path.normalize(`${path.dirname(filename)}/${filepath}`);
                if (this.compiled[filepath.endsWith('.js') ? filepath : `${filepath}.js`]) {
                    return this.requireCompiled(filepath);
                }
            },
            exports,
        });
        vm.runInContext(this.compiled[`${filename}.js`], context);
        return exports;
    }
    isValidFile(file) {
        if (!file || !file.name || !file.content) {
            return false;
        }
        return file.name.trim() !== ''
            && path.normalize(file.name)
            && file.content.trim() !== '';
    }
}
exports.AppsCompiler = AppsCompiler;
//# sourceMappingURL=AppsCompiler.js.map