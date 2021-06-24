interface ProgressListener {
	upload(percent: number): void;

	download(percent: number): void;
}

