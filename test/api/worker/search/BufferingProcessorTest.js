// @flow

import o from "ospec"
import {BufferingProcessor} from "../../../../src/api/worker/search/BufferingProcessor"
import type {Thunk} from "../../../../src/api/common/utils/Utils"
import {defer, downcast} from "../../../../src/api/common/utils/Utils"
import type {ScheduledId, Scheduler} from "../../../../src/api/common/Scheduler"

o.spec("BufferingProcessor", function () {

	o("add one then process", async function () {
		const scheduler = new SchedulerMock()
		const processor = o.spy()
		const buffer = new BufferingProcessor(scheduler, processor, NaN)

		buffer.add(1)

		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		o(processor.calls.map(call => call.args)).deepEquals([[[1]]])
	})

	o("scheduling buffers and cancels previously scheduled", async function () {
		const scheduler = new SchedulerMock()
		const processor = o.spy()
		const buffer = new BufferingProcessor(scheduler, processor, NaN)

		buffer.add(1)
		o(scheduler.currentId).equals(buffer._timeoutId)

		buffer.add(2)
		o(scheduler.currentId).equals(buffer._timeoutId)

		buffer.add(3)
		o(scheduler.currentId).equals(buffer._timeoutId)

		o(scheduler.schedule.size).equals(1)

		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		o(processor.calls.map(call => call.args)).deepEquals([[[1, 2, 3]]])
	})

	o("schedule multiple times, no overlap", async function () {
		const scheduler = new SchedulerMock()
		const processor = o.spy(() => Promise.resolve())
		const buffer = new BufferingProcessor(scheduler, processor, NaN)

		buffer.add(1)
		buffer.add(2)
		buffer.add(3)

		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add('a')
		buffer.add('b')
		buffer.add('c')

		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add("foo")
		buffer.add("bar")
		buffer.add("baz")

		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		o(processor.calls.map(call => call.args)).deepEquals([[[1, 2, 3]], [['a', 'b', 'c']], [["foo", "bar", "baz"]]])
	})

	o("scheduling multiple, has error, no overlap", async function () {
		const scheduler = new SchedulerMock()

		const omens = [false, true, false]
		const processor = o.spy(async () => {
			if (omens.pop() === true) {
				throw new Error("whoopsie daisy")
			}
		})

		const buffer = new BufferingProcessor(scheduler, processor, NaN)

		buffer.add(1)
		buffer.add(2)
		buffer.add(3)

		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add('a')
		buffer.add('b')
		buffer.add('c')

		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add("foo")
		buffer.add("bar")
		buffer.add("baz")

		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()


		o(processor.calls.map(call => call.args)).deepEquals([[[1, 2, 3]], [['a', 'b', 'c']], [['a', 'b', 'c', "foo", "bar", "baz"]]])
	})

	o("schedule multiple times, with overlap", async function () {
		const scheduler = new SchedulerMock()

		const firstCallDeferred = defer()
		const processorPromises = [firstCallDeferred.promise]
		const processor = o.spy(() => processorPromises.pop() ?? Promise.resolve())
		const buffer = new BufferingProcessor(scheduler, processor, NaN)

		buffer.add(1)
		buffer.add(2)
		buffer.add(3)

		scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add('a')
		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add('b')
		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add('c')
		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		await firstCallDeferred.resolve()
		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		o(processor.calls.map(call => call.args)).deepEquals([[[1, 2, 3]], [['a', 'b', 'c']]])
	})

	o("schedule multiple times, has error, with overlap", async function () {
		const scheduler = new SchedulerMock()

		const firstCallDeferred = defer()
		const processorPromises = [firstCallDeferred.promise]
		const processor = o.spy(() => processorPromises.pop() ?? Promise.resolve())
		const buffer = new BufferingProcessor(scheduler, processor, NaN)

		buffer.add(1)
		buffer.add(2)
		buffer.add(3)

		scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add('a')
		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add('b')
		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		buffer.add('c')
		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		await firstCallDeferred.reject(new Error("Ouch!!!"))
		await scheduler.schedule.get(downcast(scheduler.currentId))?.thunk()

		o(processor.calls.map(call => call.args)).deepEquals([[[1, 2, 3]], [[1, 2, 3, 'a', 'b', 'c']]])
	})
})


class SchedulerMock implements Scheduler {

	currentId: number
	schedule: Map<ScheduledId, {time: number, thunk: Thunk}>

	constructor() {
		this.currentId = downcast(-1)
		this.schedule = new Map()
	}

	scheduleAt() {
		throw new Error("Don't call this ok?")
	}

	scheduleIn(thunk, time) {
		const id = downcast(++this.currentId)
		this.schedule.set(id, {time, thunk})
		return id
	}

	unschedule(id) {
		id = downcast(id)
		const scheduled = this.schedule.get(id)
		if (scheduled) {
			this.schedule.delete(id)
		}
	}
}