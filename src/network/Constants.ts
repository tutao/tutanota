export const enum WsConnectionState {
	connecting,
	connected,
	terminated,
}
export const enum ConnectMode {
	Initial,
	Reconnect,
}
export const enum CloseEventBusOption {
	Terminate = "terminate",
	Reconnect = "reconnect",
	Pause = "pause",
}
