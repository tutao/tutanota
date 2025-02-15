import { __commonJS } from "./chunk-chunk.js";

//#region libs/stream.js
var require_stream = __commonJS({ "libs/stream.js"(exports, module) {
	(function() {
		"use strict";
		Stream.SKIP = {};
		Stream.lift = lift;
		Stream.scan = scan;
		Stream.merge = merge;
		Stream.combine = combine;
		Stream.scanMerge = scanMerge;
		Stream["fantasy-land/of"] = Stream;
		var warnedHalt = false;
		Object.defineProperty(Stream, "HALT", { get: function() {
			warnedHalt || console.log("HALT is deprecated and has been renamed to SKIP");
			warnedHalt = true;
			return Stream.SKIP;
		} });
		function Stream(value) {
			var dependentStreams = [];
			var dependentFns = [];
			function stream(v) {
				if (arguments.length && v !== Stream.SKIP) {
					value = v;
					if (open(stream)) {
						stream._changing();
						stream._state = "active";
						dependentStreams.slice().forEach(function(s, i) {
							if (open(s)) s(this[i](value));
						}, dependentFns.slice());
					}
				}
				return value;
			}
			stream.constructor = Stream;
			stream._state = arguments.length && value !== Stream.SKIP ? "active" : "pending";
			stream._parents = [];
			stream._changing = function() {
				if (open(stream)) stream._state = "changing";
				dependentStreams.forEach(function(s) {
					s._changing();
				});
			};
			stream._map = function(fn, ignoreInitial) {
				var target = ignoreInitial ? Stream() : Stream(fn(value));
				target._parents.push(stream);
				dependentStreams.push(target);
				dependentFns.push(fn);
				return target;
			};
			stream.map = function(fn) {
				return stream._map(fn, stream._state !== "active");
			};
			var end;
			function createEnd() {
				end = Stream();
				end.map(function(value$1) {
					if (value$1 === true) {
						stream._parents.forEach(function(p) {
							p._unregisterChild(stream);
						});
						stream._state = "ended";
						stream._parents.length = dependentStreams.length = dependentFns.length = 0;
					}
					return value$1;
				});
				return end;
			}
			stream.toJSON = function() {
				return value != null && typeof value.toJSON === "function" ? value.toJSON() : value;
			};
			stream["fantasy-land/map"] = stream.map;
			stream["fantasy-land/ap"] = function(x) {
				return combine(function(s1, s2) {
					return s1()(s2());
				}, [x, stream]);
			};
			stream._unregisterChild = function(child) {
				var childIndex = dependentStreams.indexOf(child);
				if (childIndex !== -1) {
					dependentStreams.splice(childIndex, 1);
					dependentFns.splice(childIndex, 1);
				}
			};
			Object.defineProperty(stream, "end", { get: function() {
				return end || createEnd();
			} });
			return stream;
		}
		function combine(fn, streams) {
			var ready = streams.every(function(s) {
				if (s.constructor !== Stream) throw new Error("Ensure that each item passed to stream.combine/stream.merge/lift is a stream.");
				return s._state === "active";
			});
			var stream = ready ? Stream(fn.apply(null, streams.concat([streams]))) : Stream();
			var changed = [];
			var mappers = streams.map(function(s) {
				return s._map(function(value) {
					changed.push(s);
					if (ready || streams.every(function(s$1) {
						return s$1._state !== "pending";
					})) {
						ready = true;
						stream(fn.apply(null, streams.concat([changed])));
						changed = [];
					}
					return value;
				}, true);
			});
			var endStream = stream.end.map(function(value) {
				if (value === true) {
					mappers.forEach(function(mapper) {
						mapper.end(true);
					});
					endStream.end(true);
				}
				return undefined;
			});
			return stream;
		}
		function merge(streams) {
			return combine(function() {
				return streams.map(function(s) {
					return s();
				});
			}, streams);
		}
		function scan(fn, acc, origin) {
			var stream = origin.map(function(v) {
				var next = fn(acc, v);
				if (next !== Stream.SKIP) acc = next;
				return next;
			});
			stream(acc);
			return stream;
		}
		function scanMerge(tuples, seed) {
			var streams = tuples.map(function(tuple) {
				return tuple[0];
			});
			var stream = combine(function() {
				var changed = arguments[arguments.length - 1];
				streams.forEach(function(stream$1, i) {
					if (changed.indexOf(stream$1) > -1) seed = tuples[i][1](seed, stream$1());
				});
				return seed;
			}, streams);
			stream(seed);
			return stream;
		}
		function lift() {
			var fn = arguments[0];
			var streams = Array.prototype.slice.call(arguments, 1);
			return merge(streams).map(function(streams$1) {
				return fn.apply(undefined, streams$1);
			});
		}
		function open(s) {
			return s._state === "pending" || s._state === "active" || s._state === "changing";
		}
		if (typeof module !== "undefined") module["exports"] = Stream;
else if (typeof window.m === "function" && !("stream" in window.m)) window.m.stream = Stream;
else window.m = { stream: Stream };
	})();
} });

//#endregion
export { require_stream };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyZWFtLWNodW5rLmpzIiwibmFtZXMiOlsidmFsdWUiLCJzIiwic3RyZWFtIiwic3RyZWFtcyJdLCJzb3VyY2VzIjpbIi4uL2xpYnMvc3RyZWFtLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG47KGZ1bmN0aW9uKCkge1xuXCJ1c2Ugc3RyaWN0XCJcbi8qIGVzbGludC1lbmFibGUgKi9cblN0cmVhbS5TS0lQID0ge31cblN0cmVhbS5saWZ0ID0gbGlmdFxuU3RyZWFtLnNjYW4gPSBzY2FuXG5TdHJlYW0ubWVyZ2UgPSBtZXJnZVxuU3RyZWFtLmNvbWJpbmUgPSBjb21iaW5lXG5TdHJlYW0uc2Nhbk1lcmdlID0gc2Nhbk1lcmdlXG5TdHJlYW1bXCJmYW50YXN5LWxhbmQvb2ZcIl0gPSBTdHJlYW1cblxudmFyIHdhcm5lZEhhbHQgPSBmYWxzZVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0cmVhbSwgXCJIQUxUXCIsIHtcblx0Z2V0OiBmdW5jdGlvbigpIHtcblx0XHR3YXJuZWRIYWx0IHx8IGNvbnNvbGUubG9nKFwiSEFMVCBpcyBkZXByZWNhdGVkIGFuZCBoYXMgYmVlbiByZW5hbWVkIHRvIFNLSVBcIik7XG5cdFx0d2FybmVkSGFsdCA9IHRydWVcblx0XHRyZXR1cm4gU3RyZWFtLlNLSVBcblx0fVxufSlcblxuZnVuY3Rpb24gU3RyZWFtKHZhbHVlKSB7XG5cdHZhciBkZXBlbmRlbnRTdHJlYW1zID0gW11cblx0dmFyIGRlcGVuZGVudEZucyA9IFtdXG5cblx0ZnVuY3Rpb24gc3RyZWFtKHYpIHtcblx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCAmJiB2ICE9PSBTdHJlYW0uU0tJUCkge1xuXHRcdFx0dmFsdWUgPSB2XG5cdFx0XHRpZiAob3BlbihzdHJlYW0pKSB7XG5cdFx0XHRcdHN0cmVhbS5fY2hhbmdpbmcoKVxuXHRcdFx0XHRzdHJlYW0uX3N0YXRlID0gXCJhY3RpdmVcIlxuXHRcdFx0XHQvLyBDbG9uaW5nIHRoZSBsaXN0IHRvIGVuc3VyZSBpdCdzIHN0aWxsIGl0ZXJhdGVkIGluIGludGVuZGVkXG5cdFx0XHRcdC8vIG9yZGVyXG5cdFx0XHRcdGRlcGVuZGVudFN0cmVhbXMuc2xpY2UoKS5mb3JFYWNoKGZ1bmN0aW9uKHMsIGkpIHtcblx0XHRcdFx0XHRpZiAob3BlbihzKSkgcyh0aGlzW2ldKHZhbHVlKSlcblx0XHRcdFx0fSwgZGVwZW5kZW50Rm5zLnNsaWNlKCkpXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHZhbHVlXG5cdH1cblxuXHRzdHJlYW0uY29uc3RydWN0b3IgPSBTdHJlYW1cblx0c3RyZWFtLl9zdGF0ZSA9IGFyZ3VtZW50cy5sZW5ndGggJiYgdmFsdWUgIT09IFN0cmVhbS5TS0lQID8gXCJhY3RpdmVcIiA6IFwicGVuZGluZ1wiXG5cdHN0cmVhbS5fcGFyZW50cyA9IFtdXG5cblx0c3RyZWFtLl9jaGFuZ2luZyA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChvcGVuKHN0cmVhbSkpIHN0cmVhbS5fc3RhdGUgPSBcImNoYW5naW5nXCJcblx0XHRkZXBlbmRlbnRTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24ocykge1xuXHRcdFx0cy5fY2hhbmdpbmcoKVxuXHRcdH0pXG5cdH1cblxuXHRzdHJlYW0uX21hcCA9IGZ1bmN0aW9uKGZuLCBpZ25vcmVJbml0aWFsKSB7XG5cdFx0dmFyIHRhcmdldCA9IGlnbm9yZUluaXRpYWwgPyBTdHJlYW0oKSA6IFN0cmVhbShmbih2YWx1ZSkpXG5cdFx0dGFyZ2V0Ll9wYXJlbnRzLnB1c2goc3RyZWFtKVxuXHRcdGRlcGVuZGVudFN0cmVhbXMucHVzaCh0YXJnZXQpXG5cdFx0ZGVwZW5kZW50Rm5zLnB1c2goZm4pXG5cdFx0cmV0dXJuIHRhcmdldFxuXHR9XG5cblx0c3RyZWFtLm1hcCA9IGZ1bmN0aW9uKGZuKSB7XG5cdFx0cmV0dXJuIHN0cmVhbS5fbWFwKGZuLCBzdHJlYW0uX3N0YXRlICE9PSBcImFjdGl2ZVwiKVxuXHR9XG5cblx0dmFyIGVuZFxuXHRmdW5jdGlvbiBjcmVhdGVFbmQoKSB7XG5cdFx0ZW5kID0gU3RyZWFtKClcblx0XHRlbmQubWFwKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRpZiAodmFsdWUgPT09IHRydWUpIHtcblx0XHRcdFx0c3RyZWFtLl9wYXJlbnRzLmZvckVhY2goZnVuY3Rpb24gKHApIHtwLl91bnJlZ2lzdGVyQ2hpbGQoc3RyZWFtKX0pXG5cdFx0XHRcdHN0cmVhbS5fc3RhdGUgPSBcImVuZGVkXCJcblx0XHRcdFx0c3RyZWFtLl9wYXJlbnRzLmxlbmd0aCA9IGRlcGVuZGVudFN0cmVhbXMubGVuZ3RoID0gZGVwZW5kZW50Rm5zLmxlbmd0aCA9IDBcblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWx1ZVxuXHRcdH0pXG5cdFx0cmV0dXJuIGVuZFxuXHR9XG5cblx0c3RyZWFtLnRvSlNPTiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUudG9KU09OID09PSBcImZ1bmN0aW9uXCIgPyB2YWx1ZS50b0pTT04oKSA6IHZhbHVlIH1cblxuXHRzdHJlYW1bXCJmYW50YXN5LWxhbmQvbWFwXCJdID0gc3RyZWFtLm1hcFxuXHRzdHJlYW1bXCJmYW50YXN5LWxhbmQvYXBcIl0gPSBmdW5jdGlvbih4KSB7IHJldHVybiBjb21iaW5lKGZ1bmN0aW9uKHMxLCBzMikgeyByZXR1cm4gczEoKShzMigpKSB9LCBbeCwgc3RyZWFtXSkgfVxuXG5cdHN0cmVhbS5fdW5yZWdpc3RlckNoaWxkID0gZnVuY3Rpb24oY2hpbGQpIHtcblx0XHR2YXIgY2hpbGRJbmRleCA9IGRlcGVuZGVudFN0cmVhbXMuaW5kZXhPZihjaGlsZClcblx0XHRpZiAoY2hpbGRJbmRleCAhPT0gLTEpIHtcblx0XHRcdGRlcGVuZGVudFN0cmVhbXMuc3BsaWNlKGNoaWxkSW5kZXgsIDEpXG5cdFx0XHRkZXBlbmRlbnRGbnMuc3BsaWNlKGNoaWxkSW5kZXgsIDEpXG5cdFx0fVxuXHR9XG5cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KHN0cmVhbSwgXCJlbmRcIiwge1xuXHRcdGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBlbmQgfHwgY3JlYXRlRW5kKCkgfVxuXHR9KVxuXG5cdHJldHVybiBzdHJlYW1cbn1cblxuZnVuY3Rpb24gY29tYmluZShmbiwgc3RyZWFtcykge1xuXHR2YXIgcmVhZHkgPSBzdHJlYW1zLmV2ZXJ5KGZ1bmN0aW9uKHMpIHtcblx0XHRpZiAocy5jb25zdHJ1Y3RvciAhPT0gU3RyZWFtKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRW5zdXJlIHRoYXQgZWFjaCBpdGVtIHBhc3NlZCB0byBzdHJlYW0uY29tYmluZS9zdHJlYW0ubWVyZ2UvbGlmdCBpcyBhIHN0cmVhbS5cIilcblx0XHRyZXR1cm4gcy5fc3RhdGUgPT09IFwiYWN0aXZlXCJcblx0fSlcblx0dmFyIHN0cmVhbSA9IHJlYWR5XG5cdFx0PyBTdHJlYW0oZm4uYXBwbHkobnVsbCwgc3RyZWFtcy5jb25jYXQoW3N0cmVhbXNdKSkpXG5cdFx0OiBTdHJlYW0oKVxuXG5cdHZhciBjaGFuZ2VkID0gW11cblxuXHR2YXIgbWFwcGVycyA9IHN0cmVhbXMubWFwKGZ1bmN0aW9uKHMpIHtcblx0XHRyZXR1cm4gcy5fbWFwKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRjaGFuZ2VkLnB1c2gocylcblx0XHRcdGlmIChyZWFkeSB8fCBzdHJlYW1zLmV2ZXJ5KGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMuX3N0YXRlICE9PSBcInBlbmRpbmdcIiB9KSkge1xuXHRcdFx0XHRyZWFkeSA9IHRydWVcblx0XHRcdFx0c3RyZWFtKGZuLmFwcGx5KG51bGwsIHN0cmVhbXMuY29uY2F0KFtjaGFuZ2VkXSkpKVxuXHRcdFx0XHRjaGFuZ2VkID0gW11cblx0XHRcdH1cblx0XHRcdHJldHVybiB2YWx1ZVxuXHRcdH0sIHRydWUpXG5cdH0pXG5cblx0dmFyIGVuZFN0cmVhbSA9IHN0cmVhbS5lbmQubWFwKGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKHZhbHVlID09PSB0cnVlKSB7XG5cdFx0XHRtYXBwZXJzLmZvckVhY2goZnVuY3Rpb24obWFwcGVyKSB7IG1hcHBlci5lbmQodHJ1ZSkgfSlcblx0XHRcdGVuZFN0cmVhbS5lbmQodHJ1ZSlcblx0XHR9XG5cdFx0cmV0dXJuIHVuZGVmaW5lZFxuXHR9KVxuXG5cdHJldHVybiBzdHJlYW1cbn1cblxuZnVuY3Rpb24gbWVyZ2Uoc3RyZWFtcykge1xuXHRyZXR1cm4gY29tYmluZShmdW5jdGlvbigpIHsgcmV0dXJuIHN0cmVhbXMubWFwKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIHMoKSB9KSB9LCBzdHJlYW1zKVxufVxuXG5mdW5jdGlvbiBzY2FuKGZuLCBhY2MsIG9yaWdpbikge1xuXHR2YXIgc3RyZWFtID0gb3JpZ2luLm1hcChmdW5jdGlvbih2KSB7XG5cdFx0dmFyIG5leHQgPSBmbihhY2MsIHYpXG5cdFx0aWYgKG5leHQgIT09IFN0cmVhbS5TS0lQKSBhY2MgPSBuZXh0XG5cdFx0cmV0dXJuIG5leHRcblx0fSlcblx0c3RyZWFtKGFjYylcblx0cmV0dXJuIHN0cmVhbVxufVxuXG5mdW5jdGlvbiBzY2FuTWVyZ2UodHVwbGVzLCBzZWVkKSB7XG5cdHZhciBzdHJlYW1zID0gdHVwbGVzLm1hcChmdW5jdGlvbih0dXBsZSkgeyByZXR1cm4gdHVwbGVbMF0gfSlcblxuXHR2YXIgc3RyZWFtID0gY29tYmluZShmdW5jdGlvbigpIHtcblx0XHR2YXIgY2hhbmdlZCA9IGFyZ3VtZW50c1thcmd1bWVudHMubGVuZ3RoIC0gMV1cblx0XHRzdHJlYW1zLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtLCBpKSB7XG5cdFx0XHRpZiAoY2hhbmdlZC5pbmRleE9mKHN0cmVhbSkgPiAtMSlcblx0XHRcdFx0c2VlZCA9IHR1cGxlc1tpXVsxXShzZWVkLCBzdHJlYW0oKSlcblx0XHR9KVxuXG5cdFx0cmV0dXJuIHNlZWRcblx0fSwgc3RyZWFtcylcblxuXHRzdHJlYW0oc2VlZClcblxuXHRyZXR1cm4gc3RyZWFtXG59XG5cbmZ1bmN0aW9uIGxpZnQoKSB7XG5cdHZhciBmbiA9IGFyZ3VtZW50c1swXVxuXHR2YXIgc3RyZWFtcyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSlcblx0cmV0dXJuIG1lcmdlKHN0cmVhbXMpLm1hcChmdW5jdGlvbihzdHJlYW1zKSB7XG5cdFx0cmV0dXJuIGZuLmFwcGx5KHVuZGVmaW5lZCwgc3RyZWFtcylcblx0fSlcbn1cblxuZnVuY3Rpb24gb3BlbihzKSB7XG5cdHJldHVybiBzLl9zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHwgcy5fc3RhdGUgPT09IFwiYWN0aXZlXCIgfHwgcy5fc3RhdGUgPT09IFwiY2hhbmdpbmdcIlxufVxuXG5pZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIikgbW9kdWxlW1wiZXhwb3J0c1wiXSA9IFN0cmVhbVxuZWxzZSBpZiAodHlwZW9mIHdpbmRvdy5tID09PSBcImZ1bmN0aW9uXCIgJiYgIShcInN0cmVhbVwiIGluIHdpbmRvdy5tKSkgd2luZG93Lm0uc3RyZWFtID0gU3RyZWFtXG5lbHNlIHdpbmRvdy5tID0ge3N0cmVhbSA6IFN0cmVhbX1cblxufSgpKTtcbiJdLCJtYXBwaW5ncyI6Ijs7OztBQUNDLENBQUMsWUFBVztBQUNiO0FBRUEsU0FBTyxPQUFPLENBQUU7QUFDaEIsU0FBTyxPQUFPO0FBQ2QsU0FBTyxPQUFPO0FBQ2QsU0FBTyxRQUFRO0FBQ2YsU0FBTyxVQUFVO0FBQ2pCLFNBQU8sWUFBWTtBQUNuQixTQUFPLHFCQUFxQjtFQUU1QixJQUFJLGFBQWE7QUFDakIsU0FBTyxlQUFlLFFBQVEsUUFBUSxFQUNyQyxLQUFLLFdBQVc7QUFDZixpQkFBYyxRQUFRLElBQUksa0RBQWtEO0FBQzVFLGdCQUFhO0FBQ2IsVUFBTyxPQUFPO0VBQ2QsRUFDRCxFQUFDO0VBRUYsU0FBUyxPQUFPLE9BQU87R0FDdEIsSUFBSSxtQkFBbUIsQ0FBRTtHQUN6QixJQUFJLGVBQWUsQ0FBRTtHQUVyQixTQUFTLE9BQU8sR0FBRztBQUNsQixRQUFJLFVBQVUsVUFBVSxNQUFNLE9B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