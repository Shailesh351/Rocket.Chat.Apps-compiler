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
const fs = __importStar(require("fs-extra"));
const Yazl = __importStar(require("yazl"));
const glob_1 = __importDefault(require("glob"));
const metadata_1 = require("@rocket.chat/apps-engine/definition/metadata");
class AppPackager {
    constructor(compilerDesc, fd, compiledApp, outputFilename) {
        this.compilerDesc = compilerDesc;
        this.fd = fd;
        this.compiledApp = compiledApp;
        this.outputFilename = outputFilename;
        this.zip = new Yazl.ZipFile();
    }
    async zipItUp() {
        const zipName = this.outputFilename;
        this.zip.addBuffer(Buffer.from(JSON.stringify(this.compilerDesc)), '.packagedby', { compress: true });
        this.overwriteAppManifest();
        this.zipFromCompiledSource();
        await this.zipSupportFiles();
        this.zip.end();
        await this.asyncWriteZip(this.zip, zipName);
        return zipName;
    }
    overwriteAppManifest() {
        this.fd.info.implements = this.compiledApp.getImplemented()
            .filter((interfaceName) => !!metadata_1.AppInterface[interfaceName]);
        fs.writeFileSync(this.fd.infoFile, JSON.stringify(this.fd.info, null, 4));
    }
    async zipSupportFiles() {
        let matches;
        try {
            matches = await this.asyncGlob();
        }
        catch (e) {
            console.warn(`Failed to retrieve the list of files for the App ${this.fd.info.name}.`);
            throw e;
        }
        if (matches.length === 0) {
            throw new Error('No files to package were found');
        }
        await Promise.all(matches.map(async (realPath) => {
            const zipPath = path.relative(this.fd.folder, realPath);
            const fileStat = await fs.stat(realPath);
            const options = {
                compress: true,
                mtime: fileStat.mtime,
                mode: fileStat.mode,
            };
            this.zip.addFile(realPath, zipPath, options);
        }));
    }
    zipFromCompiledSource() {
        Object.entries(this.compiledApp.output())
            .map(([filename, contents]) => this.zip.addBuffer(Buffer.from(contents), filename, { compress: true }));
    }
    asyncGlob() {
        return new Promise((resolve, reject) => {
            glob_1.default(this.fd.toZip, AppPackager.GlobOptions, (err, matches) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(matches);
            });
        });
    }
    asyncWriteZip(zip, zipName) {
        return new Promise((resolve) => {
            fs.mkdirpSync(path.dirname(zipName));
            zip.outputStream.pipe(fs.createWriteStream(zipName)).on('close', resolve);
        });
    }
}
AppPackager.GlobOptions = {
    dot: false,
    silent: true,
    ignore: [
        '**/README.md',
        '**/tslint.json',
        '**/*.js.map',
        '**/*.ts',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/dist/**',
        '**/.*',
    ],
};
exports.AppPackager = AppPackager;
//# sourceMappingURL=appPackager.js.map