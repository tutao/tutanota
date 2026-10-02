// Patch out telemetry related code.
export const FeatureUsageFlag = {
	NONE: 0x0,
	REDIRECT_HANDLER_ENABLED: 0x1,
	RETRY_HANDLER_ENABLED: 0x2,
	AUTHENTICATION_HANDLER_ENABLED: 0x4,
}

export class TelemetryHandlerOptions {
	static updateFeatureUsageFlag() {}
	setFeatureUsage() {}
	getFeatureUsage() {}
}
