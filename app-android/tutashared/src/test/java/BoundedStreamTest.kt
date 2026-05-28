import de.tutao.tutashared.bounded
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.ByteArrayInputStream

class BoundedStreamTest {

	@Test
	fun testBoundedStreamWithSkip() {
		val inputData = byteArrayOf(1, 2, 3, 4, 5)
		val inputStream = ByteArrayInputStream(inputData)
		inputStream.skip(2)
		val output = inputStream.readBytes()
		assertArrayEquals(byteArrayOf(3, 4, 5), output)
	}

	@Test
	fun testBoundedStream() {
		val inputData = byteArrayOf(1, 2, 3, 4, 5)
		val inputStream = ByteArrayInputStream(inputData)
		val boundedStream = inputStream.bounded(1, 3)
		val output = boundedStream.readBytes()
		assertArrayEquals(byteArrayOf(2, 3, 4), output)
	}
}