//@flow
import stream from "mithril/stream/stream.js"

export type RouteChangeEvent = {args: Object, requestedPath: string}

export const routeChange: Stream<RouteChangeEvent> = stream()