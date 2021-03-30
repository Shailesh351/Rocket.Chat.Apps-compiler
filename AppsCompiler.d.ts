import * as fallbackTypescript from 'typescript';
import { ModuleResolutionHost, ResolvedModule } from 'typescript';
import { Omit } from './misc/util';
import { ICompilerDescriptor, ICompilerFile, ICompilerResult, IFiles } from './definition';
declare type TypeScript = typeof fallbackTypescript;
export declare class AppsCompiler {
    private readonly compilerDesc;
    private readonly ts;
    private readonly compilerOptions;
    private libraryFiles;
    private compiled;
    private implemented;
    private wd;
    private _appRequire;
    constructor(compilerDesc: ICompilerDescriptor, ts?: TypeScript);
    readonly appRequire: NodeRequire;
    compile(path: string): Promise<ICompilerResult>;
    output(): IFiles;
    getImplemented(): string[];
    outputZip(outputPath: string): Promise<Buffer>;
    private validateAppPermissionsSchema;
    private toJs;
    private normalizeDiagnostics;
    resolvePath(containingFile: string, moduleName: string, cwd: string): string;
    resolver(moduleName: string, resolvedModules: Array<ResolvedModule>, containingFile: string, result: Omit<ICompilerResult, 'permissions'>, cwd: string, moduleResHost: ModuleResolutionHost): number;
    getLibraryFile(fileName: string): ICompilerFile;
    private checkInheritance;
    private requireCompiled;
    private isValidFile;
}
export {};
//# sourceMappingURL=AppsCompiler.d.ts.map