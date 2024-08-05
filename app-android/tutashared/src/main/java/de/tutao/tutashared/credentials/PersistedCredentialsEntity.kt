package de.tutao.tutashared.credentials

import androidx.room.Entity
import androidx.room.PrimaryKey
import de.tutao.tutashared.CredentialType
import de.tutao.tutashared.ipc.CredentialsInfo
import de.tutao.tutashared.ipc.PersistedCredentials
import de.tutao.tutashared.ipc.wrap

@Entity(tableName = "PersistedCredentials")
class PersistedCredentialsEntity(
	// CredentialsInfo. Cannot use userId as @primarykey if it is @Embedded.
	val login: String,
	val type: CredentialType,
	@PrimaryKey val userId: String,
	val encryptedPassword: String,
	val databaseKey: ByteArray?,
	val accessToken: ByteArray,
	val encryptedPassphraseKey: ByteArray?,
) {
	override fun equals(other: Any?): Boolean {
		if (this === other) return true
		if (javaClass != other?.javaClass) return false

		other as PersistedCredentialsEntity

		if (login != other.login) return false
		if (type != other.type) return false
		if (userId != other.userId) return false
		if (encryptedPassword != other.encryptedPassword) return false
		if (databaseKey != null) {
			if (other.databaseKey == null) return false
			if (!databaseKey.contentEquals(other.databaseKey)) return false
		} else if (other.databaseKey != null) return false
		if (!accessToken.contentEquals(other.accessToken)) return false
		if (encryptedPassphraseKey != null) {
			if (other.encryptedPassphraseKey == null) return false
			if (!encryptedPassphraseKey.contentEquals(other.encryptedPassphraseKey)) return false
		} else if (other.encryptedPassphraseKey != null) return false

		return true
	}

	override fun hashCode(): Int {
		var result = login.hashCode()
		result = 31 * result + type.hashCode()
		result = 31 * result + userId.hashCode()
		result = 31 * result + encryptedPassword.hashCode()
		result = 31 * result + (databaseKey?.contentHashCode() ?: 0)
		result = 31 * result + accessToken.contentHashCode()
		result = 31 * result + (encryptedPassphraseKey?.contentHashCode() ?: 0)
		return result
	}
}


fun PersistedCredentials.toEntity(): PersistedCredentialsEntity {
	return PersistedCredentialsEntity(
		accessToken = accessToken.data,
		databaseKey = databaseKey?.data,
		encryptedPassword = encryptedPassword,
		login = credentialInfo.login,
		userId = credentialInfo.userId,
		type = credentialInfo.type,
		encryptedPassphraseKey = encryptedPassphraseKey?.data,
	)
}

fun PersistedCredentialsEntity.toObject(): PersistedCredentials {
	val credentialInfo = CredentialsInfo(
		login = login, userId = userId, type = type
	)
	return PersistedCredentials(
		accessToken = accessToken.wrap(),
		databaseKey = databaseKey?.wrap(),
		encryptedPassword = encryptedPassword,
		credentialInfo = credentialInfo,
		encryptedPassphraseKey = encryptedPassphraseKey?.wrap()
	)
}
