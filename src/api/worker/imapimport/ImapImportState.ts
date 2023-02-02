export enum ImportState {
	NOT_INITIALIZED,
	RUNNING,
	PAUSED,
	POSTPONED,
	FINISHED,
}

export class ImapImportState {
	state: ImportState
	postponedUntil: Date

	constructor(initialState: ImportState, postponedUntil: Date = new Date(Date.now())) {
		this.state = initialState
		this.postponedUntil = postponedUntil
	}
}
