# Community messaging — how it works

`/community` is a WhatsApp-shaped messenger over four Postgres tables. There is no
websocket and no message broker: the page polls one endpoint while the tab is
visible, and every write is a plain `INSERT`/`UPDATE` on the shared Neon database.

## The model

| Table | Holds |
|---|---|
| `com_chats` | one row per conversation. `kind='dm'` (two members) or `'group'`. The public room is `dm_key='main'`, `is_main=true`. |
| `com_members` | membership and per-person read state: `role`, `last_read_id`, `cleared_id`, `muted`. |
| `com_messages` | the messages. `sender_id NULL` + `sender_label` is an operator post from the admin panel. `deleted_at` is a soft delete. |
| `com_typing` | one row per (chat, person), 6-second TTL. |
| `com_presence` | `last_seen` per person; "online" is < 65 seconds. |

Read receipts need no table of their own: `com_members.last_read_id` is a
high-water mark, so "has this been read" is `peer.last_read_id >= message.id`.
That is also why the read endpoint uses `GREATEST(...)` — two tabs polling at once
can never move the mark backwards and un-read a message the other tab saw.

## Endpoints

All of them answer `401` without a customer session cookie. Everything takes the
caller from the cookie, never from the request body.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/community/sync?chat=&after=&before=` | the whole screen in one call: chats, open chat + members, new messages, typing, unread total |
| `GET` | `/api/community/chats` | the chat list on its own |
| `POST` | `/api/community/chats` | `{kind:'dm',peerId}` (idempotent) or `{kind:'group',title,memberIds}` |
| `PATCH` | `/api/community/chats/:id` | `{title}`, `{addMembers:[]}`, `{removeMember}`, `{leave}` |
| `DELETE` | `/api/community/chats/:id` | delete a group you own; a DM is only cleared for you |
| `GET` | `/api/community/chats/:id/messages?before=` | 60 messages back |
| `POST` | `/api/community/chats/:id/messages` | `{body, replyTo}` |
| `POST` | `/api/community/chats/:id/read` | `{upTo}` |
| `POST` | `/api/community/chats/:id/typing` | `{typing:true|false}` |
| `DELETE` | `/api/community/messages/:id` | soft delete: your own, or anything as a group owner/admin |
| `GET` | `/api/community/people?q=` | the member directory, with `dmId` when a thread already exists |

`/api/community/messages` (no `:id`) is kept as a compatibility shim in the old
flat shape; it reads and writes the **same** `main` room, so there is one history.

## Rules the server enforces

- **Membership is the only key.** Every read and write joins `com_members` for the
  caller. Asking for a chat you are not in answers `403`, not an empty room.
- **DMs are idempotent** through `dm_key = dm:<min>:<max>`, so two tabs opening the
  same person land on one conversation.
- **Groups** cap at 100 people; only the owner/admin may rename, add or remove;
  members may leave. If the owner leaves, the longest-standing member is promoted,
  and the last member out deletes the group.
- **Sending** is validated for length (4 000), membership, a reply target that
  belongs to that chat, and a flood ceiling of 12 messages in 8 seconds.
- **Deleting** is soft. The bubble remains as "This message was deleted" so quotes
  and receipts still resolve.
- **The public room** cannot be left or deleted, and everyone is enrolled in it
  the first time they open the page.

## Admin side

`admin/app/api/admin/community/messages` reads and writes the same `main` chat, with
`sender_id = NULL` and `sender_label = 'Dominic (Founder)'`. That is deliberate: an
operator post must not create a row in `users`, because that row would show up in
the member directory and could be paired to a WhatsApp number. The response keeps
the flat `{ user_id, user_name, message, role, created_at }` shape, so the existing
admin community page needed no change.

## Polling and cost

One request every 2.6 s per open tab, and only while the tab is visible. Each poll
is a presence upsert plus one chat-list query and one message query; membership is
not re-inserted unless it is genuinely missing. Unread counts are computed in SQL,
so a reload shows the right badges with no client state.

## Not built (deliberately)

Attachments (images/files), voice notes, message editing, in-chat search and
push notifications. Each needs a storage decision — the platform stores uploads as
base64 in Postgres (`users.avatar`, `bot_files`) — and that is a product decision
rather than a missing wire.
