/* generated file, don't edit. */

import { StructuredMailAddress } from "./StructuredMailAddress.js"
import { StructuredPhoneNumber } from "./StructuredPhoneNumber.js"
import { StructuredAddress } from "./StructuredAddress.js"
import { StructuredCustomDate } from "./StructuredCustomDate.js"
import { StructuredMessengerHandle } from "./StructuredMessengerHandle.js"
import { StructuredRelationship } from "./StructuredRelationship.js"
import { StructuredWebsite } from "./StructuredWebsite.js"
export interface StructuredContact {
	readonly id: string | null
	readonly firstName: string
	readonly lastName: string
	readonly nickname: string
	readonly company: string
	readonly birthday: string | null
	readonly mailAddresses: ReadonlyArray<StructuredMailAddress>
	readonly phoneNumbers: ReadonlyArray<StructuredPhoneNumber>
	readonly addresses: ReadonlyArray<StructuredAddress>
	readonly rawId: string | null
	readonly customDate: ReadonlyArray<StructuredCustomDate>
	readonly department: string | null
	readonly messengerHandles: ReadonlyArray<StructuredMessengerHandle>
	readonly middleName: string | null
	readonly nameSuffix: string | null
	readonly phoneticFirst: string | null
	readonly phoneticLast: string | null
	readonly phoneticMiddle: string | null
	readonly relationships: ReadonlyArray<StructuredRelationship>
	readonly websites: ReadonlyArray<StructuredWebsite>
	readonly notes: string
	readonly title: string
	readonly role: string
}
