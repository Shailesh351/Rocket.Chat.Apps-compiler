export interface IPermission {
    name: string;
}
export interface IScope {
    [permissionName: string]: IPermission;
}
export interface IAppPermissions {
    [scope: string]: IScope;
}
export declare function getAvailablePermissions(appPermissions: IAppPermissions): Array<string>;
//# sourceMappingURL=getAvailablePermissions.d.ts.map