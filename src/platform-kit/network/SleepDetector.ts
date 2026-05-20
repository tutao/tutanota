export interface ISleepDetector {
	start(onSleep: () => void): void
	stop(): void
}
