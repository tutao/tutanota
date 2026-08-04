/* generated file, don't edit. */

import { WebauthnKeyDescriptor } from "./WebauthnKeyDescriptor.js"
export interface WebAuthnSignChallenge {
	readonly challenge: Uint8Array<ArrayBuffer>
	readonly domain: string
	readonly keys: ReadonlyArray<WebauthnKeyDescriptor>
}
