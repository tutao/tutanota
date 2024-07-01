/** provide the current date/timezone depending on the environments capabilities. */
export interface DateProvider {
	now(): number

	timeZone(): string
}
