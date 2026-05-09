import { string } from "yaml/dist/schema/common/string";

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

    deprecated?: string; // warning message if deprecated
    dev?: boolean; // true if it's a devDependency
}


// Which lockfile format are we dealing with?
export type LockfileFormat = 'npm' | 'pnpm'; 

// The final result after parsing a lockfile
export interface LockfileData {
    format : LockfileFormat; // npm or pnpm
    packages : Map<string, PackageNode>; // all packages keyed for path 
    rootDependencies : Record<string, string>; // what YOUR project directly depends on
}