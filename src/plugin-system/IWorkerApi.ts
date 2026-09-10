export interface IWorkerApi {
	load(): Promise<void>
	unload(): Promise<void>
}
