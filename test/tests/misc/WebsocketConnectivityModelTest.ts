import o from "@tutao/otest"
import { WebsocketConnectivityModel } from "../../../src/common/misc/WebsocketConnectivityModel"
import { ExposedEventBus } from "../../../src/common/api/worker/workerInterfaces"
import { func, object, verify } from "testdouble"
import { WebsocketLeaderStatus } from "../../../src/common/api/entities/sys/TypeRefs"

o.spec("WebsocketConnectivityModelTest", function () {
	let websocketConnectivityModel: WebsocketConnectivityModel
	let mockEventBus: ExposedEventBus
	o.beforeEach(function () {
		mockEventBus = object()
		websocketConnectivityModel = new WebsocketConnectivityModel(mockEventBus)
	})

	o("onLeaderStatusChanged broadcasts changes", async function () {
		let leaderStatusListenerMock = func<(current: boolean) => Promise<void>>()
		websocketConnectivityModel.addLeaderStatusListener(leaderStatusListenerMock)

		const mockWebsocketLeaderStatus: WebsocketLeaderStatus = object()
		mockWebsocketLeaderStatus.leaderStatus = false
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)
		verify(leaderStatusListenerMock(false), { times: 0 }) // listener not called because value didnt change

		mockWebsocketLeaderStatus.leaderStatus = true
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)
		verify(leaderStatusListenerMock(true), { times: 1 })

		mockWebsocketLeaderStatus.leaderStatus = false
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)
		verify(leaderStatusListenerMock(false), { times: 1 })
	})

	o("onLeaderStatusChanged broadcasts its value ONLY when it is changed", async function () {
		const mockWebsocketLeaderStatus: WebsocketLeaderStatus = object()
		mockWebsocketLeaderStatus.leaderStatus = true

		let leaderStatusListenerMock = func<(current: boolean) => Promise<void>>()
		websocketConnectivityModel.addLeaderStatusListener(leaderStatusListenerMock)

		// call 2x, expect 1x.  First time is because leaderStatus stream should be instantiated as
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)

		verify(leaderStatusListenerMock(true), { times: 1 })
	})
})
