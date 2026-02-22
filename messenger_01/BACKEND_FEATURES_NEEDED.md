# Backend implementation needed for new features

The frontend expects the following API and Socket.io behavior. Add these to your Node/Express/MongoDB backend.

---

## 1. Message Search

**Route:** `GET /api/messages/search?chatId=&query=`

- **chatId:** The other user's id (conversation partner in 1-1 chat).
- **query:** Search string (case-insensitive).
- **Response:** `{ data: [ { _id, text, translatedText, originalText, createdAt, ... } ] }`
- **Logic:** Find messages where conversation involves chatId and `text` (or similar) contains query (regex or $regex, case-insensitive). Return matching messages with timestamp.

---

## 2. Call timer & missed call

**CallLog model:** Add `duration` (Number, seconds). When call ends, set `duration = (endedAt - startedAt) / 1000` and save.

**Missed call (20s, receiver gets notification):** When `call_user` is emitted, start a **20 second** timer. If the **receiver** does NOT emit `accept_call` within 20 seconds:

- **Disconnect the call:** emit `call_ended` to both caller and receiver so the caller’s “Calling…” screen ends.
- **Emit to the RECEIVER:** `receiverSocket.emit("missed_call", { callerId, callerName })` so they see “Missed call from [caller name]” and the red badge.
- Save CallLog with `status: "missed"` (optional).
- When the receiver accepts, rejects, or the call ends before 20s, clear the timer.

See **server/socket-missed-call.js** for 20s timer, disconnect, and `missed_call` to receiver.

---

## 3. Voice message

**Route:** `POST /api/messages/voice`

- **Body:** multipart with `audio` (file), `senderId`, `receiverId`.
- **Storage:** Use Multer; save under e.g. `uploads/voice/`.
- **Message model:** Support `messageType: "voice"`, `audioUrl` (or `fileUrl`), `duration` (seconds, optional).
- **Response:** Same shape as other media messages, e.g. `{ _id, sender, receiver, messageType: "voice", fileUrl, duration, createdAt }`.
- Emit to receiver via your existing new-message socket so the voice message appears in chat.

---

## 4. Message edit

**Message model:** Add `edited` (Boolean), `editedAt` (Date).

**Route:** `PUT /api/messages/edit/:id`

- **Body:** `{ text: string }`.
- **Rules:** Only sender can edit; only text messages (type `"text"`).
- **Response:** Updated message, e.g. `{ _id, text, edited: true, editedAt }`.
- After saving to DB, emit: `socket.to(receiverId).emit("message_updated", { messageId, text, edited: true, editedAt })` (and/or to sender) so all clients update the bubble and show “(edited)”.

---

## Socket summary

| Event             | Direction   | Payload |
|------------------|------------|---------|
| `missed_call`    | Server→Client | `{ callerName }` |
| `message_updated` | Server→Client | `{ messageId, text, edited, editedAt }` |

Frontend already listens for `message_updated` and `missed_call`.
