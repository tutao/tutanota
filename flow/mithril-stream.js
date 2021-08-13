// @flow

// TODO: think if they should be covariant. They probably should not be because they're not readonly
declare interface Stream<+T> {
	(): T;

	(T): T;

	map<R>(mapper: (T) => R): Stream<R>;

	end: Stream<boolean>;

	// Covariant breaks this
	// of(val?: T): Stream<T>;

	ap<U>(f: Stream<(value: T) => U>): Stream<U>;
}

// Partially taken from DefinitelyTyped
type StreamModule = {
	/** Creates a stream.*/<T>(value?: T): Stream<T>;
	/** Creates a computed stream that reactively updates if any of its upstreams are updated. Combiner accepts streams. */
	combine<T>(combiner: (...streams: any[]) => T, streams: Array<Stream<any>>): Stream<T>;
	/** Creates a computed stream that reactively updates if any of its upstreams are updated. Combiner accepts values. */
	lift<T>(combiner: (...values: any[]) => T, ...streams: Array<Stream<any>>): Stream<T>;
	/** Creates a stream whose value is the array of values from an array of streams. */
	merge(streams: Array<Stream<any>>): Stream<any[]>;
	/** Creates a new stream with the results of calling the function on every incoming stream with and accumulator and the incoming value. */
	scan<T, U>(fn: (acc: U, value: T) => U, acc: U, stream: Stream<T>): Stream<U>;
	/** Takes an array of pairs of streams and scan functions and merges all those streams using the given functions into a single stream. */
	scanMerge<T, U>(pairs: Array<[Stream<T>, (acc: U, value: T) => U]>, acc: U): Stream<U>;
	/** Takes an array of pairs of streams and scan functions and merges all those streams using the given functions into a single stream. */
	scanMerge<U>(pairs: Array<[Stream<any>, (acc: U, value: any) => U]>, acc: U): Stream<U>;
	/** A special value that can be returned to stream callbacks to halt execution of downstreams. */
	+HALT: {||};
}

declare module 'mithril/stream/stream.js' {
	declare export default StreamModule;
}