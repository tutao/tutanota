package de.tutao.calendar.testdata;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class CompressionTestData {

	String uncompressedText;
	String compressedBase64TextJava;
	String compressedBase64TextJavaScript;

	public CompressionTestData() {

	}

	public CompressionTestData(String uncompressedText, String compressedBase64TextJava, String compressedBase64TextJavaScript) {
		this.uncompressedText = uncompressedText;
		this.compressedBase64TextJava = compressedBase64TextJava;
		this.compressedBase64TextJavaScript = compressedBase64TextJavaScript;
	}

	public String getUncompressedText() {
		return uncompressedText;
	}

	public void setUncompressedText(String uncompressedText) {
		this.uncompressedText = uncompressedText;
	}

	public String getCompressedBase64TextJava() {
		return compressedBase64TextJava;
	}

	public void setCompressedBase64TextJava(String compressedBase64TextJava) {
		this.compressedBase64TextJava = compressedBase64TextJava;
	}

	public String getCompressedBase64TextJavaScript() {
		return compressedBase64TextJavaScript;
	}

	public void setCompressedBase64TextJavaScript(String compressedBase64TextJavaScript) {
		this.compressedBase64TextJavaScript = compressedBase64TextJavaScript;
	}
}
