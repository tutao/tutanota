import { createTestEntity } from "../../../TestUtils.js"
import { InvoiceDataItemTypeRef } from "../../../../../src/common/api/entities/sys/TypeRefs.js"

/**
 * Produces a bulk list of mocked InvoiceItems
 * @param amountOfEntries
 */
export function invoiceItemListMock(amountOfEntries: number) {
	const data: any = []
	for (let i = 0; i < amountOfEntries; i++) {
		data.push(
			createTestEntity(InvoiceDataItemTypeRef, {
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
