import { createTestEntity } from "../../../TestUtils.js"
import { sysTypeRefs } from "@tutao/typerefs"

/**
 * Produces a bulk list of mocked InvoiceItems
 * @param amountOfEntries
 */
export function invoiceItemListMock(amountOfEntries: number) {
	const data: any = []
	for (let i = 0; i < amountOfEntries; i++) {
		data.push(
			createTestEntity(sysTypeRefs.InvoiceDataItemTypeRef, {
				amount: `${i}`,
				startDate: new Date("09.09.1984"),
				endDate: new Date("09.09.1984"),
				singlePrice: "10.00",
				totalPrice: "10.00",
				itemType: "25",
			}),
		)
	}
	return data
}
