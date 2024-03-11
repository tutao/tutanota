package de.tutao.tutanota.credentials

import androidx.room.Entity
import androidx.room.PrimaryKey
import de.tutao.tutanota.CredentialType
import de.tutao.tutanota.ipc.CredentialsInfo
import de.tutao.tutanota.ipc.PersistedCredentials

@Entity(tableName = "PersistedCredentials")
class PersistedCredentialsEntity(
	val accessToken: String,
	val databaseKey: String?,
	val encryptedPassword: String,
	// CredentialsInfo. Cannot use userId as @primarykey if it is @Embedded.
	val login: String,
	@PrimaryKey val userId: String,
	val type: CredentialType,
)


fun PersistedCredentials.toEntity(): PersistedCredentialsEntity {
	return PersistedCredentialsEntity(
		accessToken = accessToken,
		databaseKey = databaseKey,
		encryptedPassword = encryptedPassword,
		login = credentialsInfo.login,
		userId = credentialsInfo.userId,
		type = credentialsInfo.type,
	)
}

fun PersistedCredentialsEntity.toObject(): PersistedCredentials {
	val credentialsInfo = CredentialsInfo(
		login = login,
		userId = userId,
		type = type
	)
	return PersistedCredentials(
		accessToken = accessToken,
		databaseKey = databaseKey,
		encryptedPassword = encryptedPassword,
		credentialsInfo = credentialsInfo,
	)
}
