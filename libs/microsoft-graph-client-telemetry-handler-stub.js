// Patch out telemetry related code.
export class TelemetryHandler {
	async execute(context) {
		return await this.nextMiddleware.execute(context)
	}

	setNext(next) {
		this.nextMiddleware = next
	}
}
