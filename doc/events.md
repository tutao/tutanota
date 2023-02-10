# Entity Events

Entity events are events in a log of mutations on the server. They are generated for most entities.
We download them when we receive websocket messages and also sometimes on start/reconnect.

We rely on entity events a lot: in most situations we reactively update the UI based on entity events.
They are also used on the client to keep the cache up-to-date and to replay events for indexing.

Event logs are separate for each group but this might change in the future.

We have to process events in order in most cases so we use queues for that.

```
loading
|
--\     EventBus queue
   --> |_|_|_|_|_|_|_|_| --> cache ---> LoginFacade
--/                                |--> MailFacade
|                                  |--> main thread
ws messages                        |--\     Indexer queue
                                       --> |_|_|_|_|_|_|_|_|
                                   |--/
                    Indexer init --|
```

Indexer has a separate queue for two reasons:
 - It is usually slower than the rest of the app so we don't want to wait for it to process the next event
 - It loads entity events since the last launch on startup (persistent cache will also do this in the future)

 In some cases we can optimize certain operations. E.g. two moves can be considered a single move operation or move and
 delete can be considered a single delete. We need to be careful though and not introduce any impossible state on the
 client.

 If we optimize operations for the cache, we should move them earlier, not later. In the following scenario
 it's clear why.

 Let's say that C is a create event for the group and U is an update event for the group A.
 Dots in the middle are different event. If at the point marked by `!` there is an event for
 the instance with ownerGroup A, then we should already have the group and if we don't we miss cache at best
 and run into error in the worst case.

```
 C ...... U

 C ...... _

 _ ...!.. C
```

 C - create event

 U - update event

 ! - create for instance with ownerGroup = A

 _ - skipped event

=== Entities that do not send Events

In some cases the server will not send an event update to the client. This is usually tied to a specific entity type, i.e., no events of any type will be sent for a given type, and the reason is that the client does not need to react to the change or the needed reaction is handled together with some other change.

==== BlobElementEntities

Event updates have not been implemented on the server for this metatype.
Since at the moment there is only one entity type of this kind (`MailDetailsBlob`), and all necessary updates on these entities should be handled together with updates of the `Mail` type, the implementation was not needed.
This decision will have to be reevaluated every time we introduce a new `BlobElementEntity`.