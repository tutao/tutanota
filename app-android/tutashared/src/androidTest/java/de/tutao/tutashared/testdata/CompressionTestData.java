package de.tutao.tutashared.testdata;

/**
 * Only convert to records after upgrading android to target API level 34 as this is copied to app-android!
 */
public class CompressionTestData {

	String uncompressedText;
	String compressedBase64TextJava;
	String compressedBase64TextJavaScript;
	String compressedBase64TextRust;

	public CompressionTestData() {

	}

	public CompressionTestData(String uncompressedText, String compressedBase64TextJava, String compressedBase64TextJavaScript, String compressedBase64TextRust) {
		this.uncompressedText = uncompressedText;
		this.compressedBase64TextJava = compressedBase64TextJava;
		this.compressedBase64TextJavaScript = compressedBase64TextJavaScript;
		this.compressedBase64TextRust = compressedBase64TextRust;
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

	public String getCompressedBase64TextRust() {
		return compressedBase64TextRust;
	}

	public void setCompressedBase64TextRust(String compressedBase64TextRust) {
		this.compressedBase64TextRust = compressedBase64TextRust;
	}
}
