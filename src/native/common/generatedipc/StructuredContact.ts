/* generated file, don't edit. */

import { StructuredMailAddress } from "./StructuredMailAddress.js"
import { StructuredPhoneNumber } from "./StructuredPhoneNumber.js"
export interface StructuredContact {
	readonly id: string
	readonly name: string
	readonly mailAddresses: ReadonlyArray<StructuredMailAddress>
	readonly phoneNumbers: ReadonlyArray<StructuredPhoneNumber>
}
