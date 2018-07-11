package de.tutao.tutanota;

import java.io.IOException;
import java.io.InputStream;

public class TruncatedInputStream extends InputStream {

	private final InputStream in;
	private final long beginIndex;
	private final long endIndex;
	private long position;

	/**
	 * @param endIndex Excluded
	 */
	public TruncatedInputStream(InputStream in, int beginIndex, long endIndex) {
		this.in = in;
		this.beginIndex = beginIndex;
		this.endIndex = endIndex;
		this.position = 0;
	}

	@Override
	public int read() throws IOException {
		if (this.position == 0) {
			for (int i = 0; i < beginIndex; i++) {
				in.read();
			}
			this.position = this.beginIndex;
		}

		if (this.position >= endIndex) {
			return -1;
		}
		int ch = in.read();
		if (ch != -1) {
			this.position++;
		}
		return ch;
	}
}
