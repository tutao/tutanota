import o from "@tutao/otest"
import { LeaderStatusListener, WebsocketConnectivityModel } from "../../../src/applications/common/misc/WebsocketConnectivityModel"
import { ExposedEventBus } from "../../../src/applications/common/api/worker/workerInterfaces"
import { func, object, verify } from "testdouble"

import { WebsocketLeaderStatus } from "@tutao/entities/sys"
import { ListenerPriority } from "../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"

o.spec("WebsocketConnectivityModelTest", function () {
	let websocketConnectivityModel: WebsocketConnectivityModel
	let mockEventBus: ExposedEventBus
	o.beforeEach(function () {
		mockEventBus = object()
		websocketConnectivityModel = new WebsocketConnectivityModel(mockEventBus)
	})

	o("onLeaderStatusChanged broadcasts changes", async function () {
		let leaderStatusListenerMock = {
			id: "mockLeaderStatusListenerId",
			priority: ListenerPriority.NORMAL,
			onLeaderStatusChanged: func<(current: boolean) => Promise<void>>(),
		}
		websocketConnectivityModel.addLeaderStatusListener(leaderStatusListenerMock)

		const mockWebsocketLeaderStatus: WebsocketLeaderStatus = object()
		mockWebsocketLeaderStatus.leaderStatus = false
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)
		verify(leaderStatusListenerMock.onLeaderStatusChanged(false), { times: 0 }) // listener not called because value didn't change

		mockWebsocketLeaderStatus.leaderStatus = true
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)
		verify(leaderStatusListenerMock.onLeaderStatusChanged(true), { times: 1 })

		mockWebsocketLeaderStatus.leaderStatus = false
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)
		verify(leaderStatusListenerMock.onLeaderStatusChanged(false), { times: 1 })
	})

	o("onLeaderStatusChanged broadcasts its value ONLY when it is changed", async function () {
		const mockWebsocketLeaderStatus: WebsocketLeaderStatus = object()
		mockWebsocketLeaderStatus.leaderStatus = true

		let leaderStatusListenerMock: LeaderStatusListener = {
			onLeaderStatusChanged: func<(current: boolean) => Promise<void>>(),
			priority: ListenerPriority.NORMAL,
			id: "mockLeaderStatusListenerId",
		}
		websocketConnectivityModel.addLeaderStatusListener(leaderStatusListenerMock)

		// call 2x, expect 1x.  First time is because leaderStatus stream should be instantiated as
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)
		await websocketConnectivityModel.onLeaderStatusMessageReceived(mockWebsocketLeaderStatus)

		verify(leaderStatusListenerMock.onLeaderStatusChanged(true), { times: 1 })
	})
})
