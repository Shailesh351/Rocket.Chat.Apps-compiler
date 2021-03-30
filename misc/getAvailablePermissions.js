"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getAvailablePermissions(appPermissions) {
    return Object.values(appPermissions).reduce((availablePermissions, scope) => availablePermissions.concat(Object.values(scope).map((permission) => permission.name)), []);
}
exports.getAvailablePermissions = getAvailablePermissions;
//# sourceMappingURL=getAvailablePermissions.js.map