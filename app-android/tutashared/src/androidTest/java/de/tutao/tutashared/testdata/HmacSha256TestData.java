package de.tutao.tutashared.testdata;

public class HmacSha256TestData {
	String keyHex;
	String dataHex;
	String hmacSha256TagHex;

	public HmacSha256TestData() {
	}

	public HmacSha256TestData(String keyHex, String dataHex, String hmacSha256TagHex) {
		this.keyHex = keyHex;
		this.dataHex = dataHex;
		this.hmacSha256TagHex = hmacSha256TagHex;
	}

	public String getKeyHex() {
		return keyHex;
	}

	public void setKeyHex(String keyHex) {
		this.keyHex = keyHex;
	}

	public String getDataHex() {
		return dataHex;
	}

	public void setDataHex(String dataHex) {
		this.dataHex = dataHex;
	}

	public String getHmacSha256TagHex() {
		return hmacSha256TagHex;
	}

	public void setHmacSha256TagHex(String hmacSha256TagHex) {
		this.hmacSha256TagHex = hmacSha256TagHex;
	}

}
