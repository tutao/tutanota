package de.tutao.calendar.testdata;

import java.util.List;

import javax.annotation.Nullable;

public class ByteArrayEncodingTestData {

	@Nullable
	String encodedByteArrayAsHex;
	List<String> byteArraysAsHex;

	@Nullable
	String encodingError;

	public String getEncodedByteArrayAsHex() {
		return encodedByteArrayAsHex;
	}

	public ByteArrayEncodingTestData setEncodedByteArrayAsHex(String encodedByteArrayAsHex) {
		this.encodedByteArrayAsHex = encodedByteArrayAsHex;
		return this;
	}

	public List<String> getByteArraysAsHex() {
		return byteArraysAsHex;
	}

	public ByteArrayEncodingTestData setByteArraysAsHex(List<String> byteArraysAsHex) {
		this.byteArraysAsHex = byteArraysAsHex;
		return this;
	}

	public ByteArrayEncodingTestData setEncodingError(String encodingError) {
		this.encodingError = encodingError;
		return this;
	}

	public String getEncodingError() {
		return encodingError;
	}
}
