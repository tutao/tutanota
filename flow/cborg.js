// @flow

declare module "cborg" {
	declare export interface DecodeOptions {
		allowIndefinite?: boolean;
		allowUndefined?: boolean;
		allowInfinity?: boolean;
		allowNaN?: boolean;
		allowBigInt?: boolean;
		strict?: boolean;
		useMaps?: boolean;
		// tags?: TagDecoder[];
		// tokenizer?: DecodeTokenizer;
	}

	declare export function decode(data: Uint8Array, options?: DecodeOptions | void): any;

	// declare export function encode(): void;
}