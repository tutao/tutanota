export interface DateProvider {
	now(): number

	timeZone(): string
}
