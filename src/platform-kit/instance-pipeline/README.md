### Color legend:
- Green is Client Model
- Red is Sever Model

## Sending/ Receiving Entities to/ from Server

```mermaid
flowchart TD
	subgraph send["Sending entities to server"]
		direction TD
		Entity_out["Entity"] -->|" ModelMapper::<br/>mapToDecryptedInstance() "| DecryptedParsedInstance_out
		OfflineStorage_out("Offline Storage") --> OfflineEntity_out["Offline Entity"] -->|" OfflineMapper::<br/>toParsedEntity() "| DecryptedParsedInstance_out
		DecryptedParsedInstance_out["DecryptedParsedInstance"] -->|" CryptoMapper::<br/>encryptParsedInstance "| EncryptedParsedInstance_out["EncryptedParsedInstance"] -->|" TypeMapper::<br/>makeServerJson "| OutgoingServerJson -->|" TypeMapper::<br/>getJsonRepresentation() "| JSON_out["Wire JSON"]
	end

	subgraph receive["Receiving entities from server"]
		direction TD
		JSON_in["Wire JSON"] -->|" TypeMapper::<br/>expectSingleInstance() "| IncomingServerJson -->|" TypeMapper::<br/>parseServerJson() "| EncryptedParsedInstance_in["EncryptedParsedInstance"] -->|" CryptoMapper::<br/>decryptParsedInstance() "| DecryptedParsedInstance_in["DecryptedParsedInstance"]
		DecryptedParsedInstance_in -->|" ModelMapper::<br/>mapToInstance() "| Entity_in["Entity"]
		DecryptedParsedInstance_in -->|" OfflineMapper::<br />toOfflineEntity() "| OfflineEntity_in["Offline Entity"] --> OfflineStorage("OfflineStorage")
	end

	classDef serverModel fill: #F4CCCC
	classDef clientModel fill: #D9EAD3
	class OfflineEntity_out,JSON_in,IncomingServerJson,EncryptedParsedInstance_in,DecryptedParsedInstance_in,OfflineEntity_in serverModel
	class Entity_out,Entity_in,DecryptedParsedInstance_out,EncryptedParsedInstance_out,OutgoingServerJson,JSON_out clientModel
```

## Receiving patch from entityUpdate

```mermaid
flowchart TD
	EntityEvent --> JSON_PATCH

subgraph entity_from_offline_storage[" "]
direction LR
OfflineStorage_in["Offline Storage"] --> STORED_ENTITY["DecryptedParsedInstance"]
end

style entity_from_offline_storage fill: none, stroke: none

subgraph patch_merger["Patch Merger"]
direction TD
JSON_PATCH["Json PatchPayload"]
Pm_merge(["PatchMerger::merge()"])
STORED_ENTITY --> Pm_merge
JSON_PATCH --> Pm_merge
Pm_merge --> MergedInstance["Patched DecryptedParsedInstance"]
end

MergedInstance --> OfflineStorage_out["Offline Storage"]

classDef serverModel fill: #F4CCCC
class STORED_ENTITY,JSON_PATCH,MergedInstance serverModel
```

## Sending Patch to server

```mermaid
flowchart TD
	OfflineStorage_in["Offline Storage"]
	pg_compute("PatchGenerator::<br/>computePatchPayload()")
	OfflineStorage_in --> orig_instance["original: DecryptedParsedInstance"]
	OfflineStorage_in --> aktiv_instance["active: DecryptedParsedInstance"]
	aktiv_instance --> modifiers([" rest of the app that does modification"])
	modifiers --> modified_parsed_instance["modified: DecryptedParsedInstance"]
	modified_parsed_instance --> pg_compute
	orig_instance --> pg_compute
	pg_compute --> patch_array["patches: Array&lt;Patches>"]
	patch_array --> rc_update["RestClient::update()"]

	classDef clientModel fill: #D9EAD3
	class orig_instance,aktiv_instance,modified_parsed_instance,patch_array clientModel
```

## Possible Optimization

Use binary format