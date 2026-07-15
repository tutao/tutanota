export const enum WsConnectionState {
	connecting = "connecting",
	connected = "connected",
	terminated = "terminated",
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
