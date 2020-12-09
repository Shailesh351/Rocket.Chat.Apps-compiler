import { IOptions } from 'glob';
import { FolderDetails } from './folderDetails';
import { AppsCompiler } from '../AppsCompiler';
import { ICompilerDescriptor } from '../definition';
export declare class AppPackager {
    private readonly compilerDesc;
    private fd;
    private compiledApp;
    private outputFilename;
    static GlobOptions: IOptions;
    private zip;
    constructor(compilerDesc: ICompilerDescriptor, fd: FolderDetails, compiledApp: AppsCompiler, outputFilename: string);
    zipItUp(): Promise<string>;
    private overwriteAppManifest;
    private zipSupportFiles;
    private zipFromCompiledSource;
    private asyncGlob;
    private asyncWriteZip;
}
