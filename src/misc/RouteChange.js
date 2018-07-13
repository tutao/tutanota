//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"

export type RouteChangeEvent = {args:Object, requestedPath:string}

export const routeChange: stream<RouteChangeEvent> = stream(m.route.get())