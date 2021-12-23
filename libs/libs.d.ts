/**
  * Type declarations for libraries that do not come with them
  */

declare type Squire = any

declare module 'squire-rte' {
	declare var Squire: any;
}

declare module 'qrcode' {
	export default any;
}

declare class SystemType {
	baseURL: string;
	babelOptions: Object;
	paths: Object;
	loads: Object;
	import(moduleName: string, normalizedParentName: string | null): Promise<unknown>;
	normalizeSync(moduleName: string): string;
	config(config: Object): void;
	getConfig(): Object;
	resolveSync(moduleName: string): string;
}

declare var System: SystemType