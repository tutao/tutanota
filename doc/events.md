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