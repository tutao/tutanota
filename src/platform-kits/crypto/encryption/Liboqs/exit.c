/**
 * exit override - lock up in an infinite loop instead (note that this is only called in case of a crash!)
 */
void exit(int reason) {
	while(1) {}
}