/* generated file, don't edit. */

import { StructuredMailAddress } from "./StructuredMailAddress.js"
import { StructuredPhoneNumber } from "./StructuredPhoneNumber.js"
import { StructuredAddress } from "./StructuredAddress.js"
export interface StructuredContact {
	readonly id: string | null
	readonly firstName: string
	readonly lastName: string
	readonly nickname: string | null
	readonly company: string
	readonly birthday: string | null
	readonly mailAddresses: ReadonlyArray<StructuredMailAddress>
	readonly phoneNumbers: ReadonlyArray<StructuredPhoneNumber>
	readonly addresses: ReadonlyArray<StructuredAddress>
	readonly rawId: string | null
}
