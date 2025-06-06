import { ContactSearchFacade } from "./ContactSearchFacade"
import { IndexedDbSearchFacade } from "./IndexedDbSearchFacade"
import { ContactTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { ClientTypeModelResolver } from "../../../common/api/common/EntityFunctions"
import { lazy, lazyMemoized, typedValues } from "@tutao/tutanota-utils"
import type { SearchRestriction } from "../../../common/api/worker/search/SearchTypes"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"

/**
 * IndexedDB-based search facade
 */
export class IndexedDbContactSearchFacade implements ContactSearchFacade {
	constructor(private readonly search: IndexedDbSearchFacade, private readonly typeModelResolver: ClientTypeModelResolver) {}

	private readonly restriction: lazy<
		Promise<{
			default: SearchRestriction
			mailAddresses: SearchRestriction
		}>
	> = lazyMemoized(async () => {
		const typeModel = await this.typeModelResolver.resolveClientTypeReference(ContactTypeRef)
		const values = typedValues(typeModel.values)
		const associations = typedValues(typeModel.associations)

		const getContactValueId = (value: string) => {
			const valueFound = values.find((v) => v.name === value) ?? associations.find((v) => v.name === value)
			if (valueFound == null) {
				throw new ProgrammingError(`can't find field ${value} on ${typeModel.name}`)
			}
			return valueFound.id
		}

		const mailAddressId = getContactValueId("mailAddresses")

		return {
			default: Object.freeze({
				type: ContactTypeRef,
				start: null,
				end: null,
				field: null,
				attributeIds: null,
				folderIds: [],
				eventSeries: null,
			}),
			mailAddresses: Object.freeze({
				type: ContactTypeRef,
				start: null,
				end: null,
				field: "mailAddresses",
				attributeIds: [mailAddressId],
				folderIds: [],
				eventSeries: null,
			}),
		}
	})

	async findContacts(query: string, field: "mailAddresses" | null, minimumSuggestions: number = 0): Promise<IdTuple[]> {
		const restrictions = await this.restriction()
		const restriction = restrictions[field ?? "default"]
		// ensure match word order for email addresses mainly
		const results = await this.search.search(`"${query}"`, restriction, minimumSuggestions)
		return results.results
	}
}
