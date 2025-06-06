/**
 * Facade for resolving queries into contacts.
 *
 * This facade provides a much simpler interface for finding contacts than using the full SearchFacade, as it only needs
 * fields specific for contacts to be passed in, and you just get the array of contact IDs as a return value.
 */
export interface ContactSearchFacade {
	/**
	 * Search for contacts
	 * @param query contact search query
	 * @param field if the field is "mailAddresses", only search by mail address. If null, search by both address and name.
	 * @param minResults optionally load until this many contacts are loaded; you may get fewer or more results than this
	 */
	findContacts(query: string, field: "mailAddresses" | null, minResults?: number): Promise<IdTuple[]>
}
