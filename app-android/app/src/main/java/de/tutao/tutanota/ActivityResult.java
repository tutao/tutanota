package de.tutao.tutanota;

import android.content.Intent;

import androidx.annotation.NonNull;

class ActivityResult {
	final int resultCode;
	@NonNull
	final Intent data;

	ActivityResult(int resultCode, @NonNull Intent data) {
		this.resultCode = resultCode;
		this.data = data;
	}
}
