"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const readdirPromise = util_1.promisify(fs_1.readdir);
const readfilePromise = util_1.promisify(fs_1.readFile);
async function walkDirectory(directory) {
    const dirents = await readdirPromise(directory, { withFileTypes: true });
    const files = await Promise.all(dirents
        .map(async (dirent) => {
        const res = path_1.resolve(directory, dirent.name);
        const dirsToIgnore = ['node_modules', '.git'];
        if (dirsToIgnore.some((dir) => res.includes(dir))) {
            return null;
        }
        if (dirent.isDirectory()) {
            return walkDirectory(res);
        }
        const content = await readfilePromise(res, 'utf8');
        return {
            content,
            name: res,
            version: 0,
        };
    })
        .filter((entry) => entry));
    return Array.prototype.concat(...files);
}
function truncateFilename(fileName, projectDirectory) {
    return path_1.normalize(fileName).substring(projectDirectory.length + 1);
}
function filterProjectFiles(projectDirectory, directoryWalkData) {
    return directoryWalkData
        .filter((file) => file)
        .map((file) => ({ ...file, name: truncateFilename(file.name, projectDirectory) }))
        .filter((file) => !file.name.startsWith('.'));
}
function makeICompilerFileMap(compilerFiles) {
    return compilerFiles
        .map((file) => ({ [file.name]: file }))
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
}
function getAppInfo(projectFiles) {
    const appJson = projectFiles.filter((file) => file.name === 'app.json')[0];
    if (!appJson) {
        throw new Error('There is no app.json file in the project');
    }
    try {
        return JSON.parse(appJson.content);
    }
    catch (error) {
        throw new Error('app.json parsing fail');
    }
}
function getTypescriptFilesFromProject(projectFiles) {
    return projectFiles.filter((file) => file.name.endsWith('.ts'));
}
async function getAppSource(path) {
    const directoryWalkData = await walkDirectory(path);
    const projectFiles = filterProjectFiles(path, directoryWalkData);
    const tsFiles = getTypescriptFilesFromProject(projectFiles);
    const appInfo = getAppInfo(projectFiles);
    const files = makeICompilerFileMap(tsFiles);
    return { appInfo, sourceFiles: files };
}
exports.getAppSource = getAppSource;
//# sourceMappingURL=getAppSource.js.map