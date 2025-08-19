import { DataPackage, ValidationOptions } from './types.js';
interface TestOptions extends ValidationOptions {
    acknowledgeDeceasedFirstNations?: boolean;
}
export declare function validateDataPackage(dataPackage: DataPackage, options?: TestOptions): void;
export {};
