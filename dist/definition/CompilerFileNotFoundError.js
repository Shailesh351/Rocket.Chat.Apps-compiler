"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CompilerFileNotFoundError extends Error {
    constructor(path) {
        super('File not found');
        this.path = path;
    }
}
exports.CompilerFileNotFoundError = CompilerFileNotFoundError;
