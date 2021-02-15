import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
export declare class FolderDetails {
    folder: string;
    toZip: string;
    infoFile: string;
    mainFile: string;
    info: IAppInfo;
    constructor(folder: string);
    doesFileExist(file: string): Promise<boolean>;
    mergeWithFolder(item: string): string;
    setAppInfo(appInfo: IAppInfo): void;
    readInfoFile(): Promise<void>;
    private validateAppManifest;
    private isValidResult;
    private reportFailed;
    private reportError;
    private reportMissing;
}
//# sourceMappingURL=folderDetails.d.ts.map