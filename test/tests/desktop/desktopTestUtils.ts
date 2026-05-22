import fs from "node:fs"
import stream from "node:stream"

export function mockFsReadStream(buffer: Buffer): fs.ReadStream {
	const s = stream.Readable.from(buffer) as unknown as fs.ReadStream
	s.close = () => {}
	return s
}
