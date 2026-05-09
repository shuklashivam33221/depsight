// This describes ONE package from the lockfile, cleaned up and normalized
export interface PackageNode {
    name : string; // "commander"
    version : string; // "14.0.3"
    dependencies : Record<string, string>; // { "undici-types": "~7.19.0" }
    // Record<string, string>
    // is a utility type used to define an object where:
    // keys are string
    // values are string

    path : string; // "node_modules/commander" "path" stores a file/folder location

    deprecated?: string; // warning message if deprecated or retired (warning message)
    dev?: boolean; // true if it's a devDependency
}


// Which lockfile format are we dealing with?
export type LockfileFormat = 'npm' | 'pnpm'; 

// The final result after parsing a lockfile
export interface LockfileData {
    format : LockfileFormat; // npm or pnpm
    packages : Map<string, PackageNode>; // all packages keyed for path // O(1) time complexity "commander": "its  path"
    rootDependencies : Record<string, string>; // what YOUR project directly depends on fromat "commander": "^14.0.3",
}

// okay how this lockfileFormat file is being used : 
// when any user types depsight lodash in terminal , 
// through commandar we will reach there and search packages : Map<string, PackageNode>; in this which is of O(1) tc and we got okay this is at some location and we will trace like this backward and ultimately if we reach to rootDependencies then it means yes this comes from here 