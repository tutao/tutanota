export interface EventLocationButtonExtension {
	eventLocationButtonClicked(roomName: string): Promise<string>
}
