package de.tutao.tutanota;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;

import javax.crypto.Cipher;

/**
 * The original implementation is too slow. This one is much faster.
 */
public class TutaoCipherInputStream extends FilterInputStream {

	private static final int UPDATE_BUFFER_SIZE = 4096;

	private final Cipher cipher;
	private byte[] temp;

	private boolean finished = false;

	public TutaoCipherInputStream(InputStream in, Cipher cipher) {
		super(in);
		this.cipher = cipher;
		temp = new byte[cipher.getOutputSize(UPDATE_BUFFER_SIZE)];
	}

	@Override
	public int read(byte[] buffer, int offset, int count) throws IOException {
		try {
			if (finished) {
				return -1;
			}
			int read = in.read(buffer, offset, count);
			if (read == -1) {
				int finalBytes = cipher.doFinal(buffer, 0);
				this.finished = true;
				return finalBytes;
			}

			int times = read / UPDATE_BUFFER_SIZE;
			int remainder = read % UPDATE_BUFFER_SIZE;

			int originalOffset = offset;
			int currentReadOffset = offset;

			for (int i = 0; i < times; ++i) {
				int bytesDecrypted = cipher.update(buffer, offset, UPDATE_BUFFER_SIZE, temp);
				System.arraycopy(temp, 0, buffer, currentReadOffset, bytesDecrypted);
				currentReadOffset += bytesDecrypted;
				offset += UPDATE_BUFFER_SIZE;
			}

			if (remainder > 0) {
				int bytesDecrypted = cipher.update(buffer, offset, remainder, temp);
				System.arraycopy(temp, 0, buffer, currentReadOffset, bytesDecrypted);
				currentReadOffset += bytesDecrypted;
			}

			if (read < count) {
				int finalBytes = cipher.doFinal(buffer, currentReadOffset);
				currentReadOffset += finalBytes;
				finished = true;
			}

			return currentReadOffset - originalOffset;
		} catch (IOException e) {
			throw e;
		} catch (Exception e) {
			throw new RuntimeException(e);
		}

	}
}