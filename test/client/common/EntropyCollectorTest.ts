import o from "ospec"
import {EntropyCollector} from "../../../src/api/main/EntropyCollector"
import {EntropySource} from "@tutao/tutanota-crypto";

o.spec("EntropyCollector", function () {
    let collector
    let worker
    o.beforeEach(
        browser(function () {
            worker = {
                initialized: {
                    isFulfilled: () => true,
                },
                entropy: o.spy(
                    (
                        entropyCache: {
                            source: EntropySource
                            entropy: number
                            data: number
                        }[],
                    ) => {
                        o(entropyCache.length > 0).equals(true)
                    },
                ),
            }
            collector = new EntropyCollector(worker)
        }),
    )
    o.afterEach(
        browser(function () {
            collector.stop()
        }),
    )

    let assertLastTwoCacheEntries = function (previousLen, expectedValue, expectedSource, expectedEntropy) {
        o(collector._entropyCache.length).equals(previousLen + 2)

        if (expectedValue !== null) {
            o(collector._entropyCache[collector._entropyCache.length - 2].data).equals(expectedValue)
        }

        o(collector._entropyCache[collector._entropyCache.length - 2].source).equals(expectedSource)
        o(collector._entropyCache[collector._entropyCache.length - 2].entropy).equals(expectedEntropy)
        o(collector._entropyCache[collector._entropyCache.length - 1].data != 0).equals(true)
        o(collector._entropyCache[collector._entropyCache.length - 1].source).equals("time")
        o(collector._entropyCache[collector._entropyCache.length - 1].entropy).equals(2)
    }

    o(
        "MouseclickNotStarted",
        browser(function () {
            let evt = new Event("click") as Writeable<MouseEvent>
            evt.clientX = 888
            evt.clientY = 777
            document.body.dispatchEvent(evt)
            o(collector._entropyCache.length).equals(0)
        }),
    )
    o(
        "Mouseclick",
        browser(function () {
            collector.start({
                entropy: () => null,
            })
            let len = collector._entropyCache.length
            let evt = new Event("click")  as Writeable<MouseEvent>
            evt.clientX = 889
            evt.clientY = 777
            window.dispatchEvent(evt)
            assertLastTwoCacheEntries(len, 889 ^ 777, "mouse", 2)
        }),
    )
    o(
        "Mousemove",
        browser(function () {
            collector.start({
                entropy: () => null,
            })
            let len = collector._entropyCache.length
            let evt = new Event("mousemove")  as Writeable<MouseEvent>
            evt.clientX = 123
            evt.clientY = 456
            window.dispatchEvent(evt)
            assertLastTwoCacheEntries(len, 123 ^ 456, "mouse", 2)
        }),
    )
    o(
        "Keydown",
        browser(function () {
            collector.start({
                entropy: () => null,
            })
            let len = collector._entropyCache.length
            let evt = new Event("keydown")  as Writeable<KeyboardEvent>
            evt.keyCode = 48
            window.dispatchEvent(evt)
            assertLastTwoCacheEntries(len, 48, "key", 2)
        }),
    )
    o(
        "Touchstart",
        browser(function () {
            collector.start({
                entropy: () => null,
            })
            let len = collector._entropyCache.length
            let evt = new Event("touchstart")  as any
            evt.touches = [
                {
                    clientX: 3,
                    clientY: 4,
                },
            ]
            window.dispatchEvent(evt)
            assertLastTwoCacheEntries(len, 3 ^ 4, "touch", 2)
        }),
    )
    o(
        "Touchmove",
        browser(function () {
            collector.start({
                entropy: () => null,
            })
            let len = collector._entropyCache.length
            let evt = new Event("touchmove") as any
            evt.touches = [
                {
                    clientX: 3,
                    clientY: 5,
                },
            ]
            window.dispatchEvent(evt)
            assertLastTwoCacheEntries(len, 3 ^ 5, "touch", 2)
        }),
    )
    o(
        "Devicemotion",
        browser(function () {
            collector.start({
                entropy: () => null,
            })
            let len = collector._entropyCache.length
            let evt = new Event("devicemotion") as any
            evt.accelerationIncludingGravity = {
                x: 3,
                y: 4,
                z: 5,
            }
            window.dispatchEvent(evt)
            // we assume window.orientation is not set
            assertLastTwoCacheEntries(len, 3 ^ 4 ^ 5, "accel", 2)
        }),
    )
    o(
        "Send",
        browser(function (done) {
            o.timeout(2000)
            collector.SEND_INTERVAL = 10
            collector.start()

            collector._addEntropy(5, 1, "mouse")

            setTimeout(() => {
                o(worker.entropy.callCount).equals(1)
                collector.SEND_INTERVAL = 5000
                done()
            }, 15)
        }),
    )
})