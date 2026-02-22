# Chat section & message sizes (reference)

## 1. Home chat section size

- **No fixed width.** The chat area is the **flexible middle column**.
- **Layout:**
  - Main app container: `w-full` (mobile) / `md:w-[95%] md:h-[92%]` of viewport (desktop).
  - Left sidebar (friends/chats): `md:w-[320px]` when visible.
  - Right panel (profile/settings): `w-0` or `md:w-[340px]` when open.
  - **Chat section** = remaining space: `flex-1` between sidebar and right panel.
- **So:** Chat section width = (main container width) − 320px − (0 or 340px).  
  Example: viewport 1200px → main ~1140px → chat width ~820px (no right panel) or ~480px (panel open).
- **Chat area background:** `bg-[#f7f8fc]` (light) / `dark:bg-[#020617]` (dark).

---

## 2. MessageBubble size

- **Bubble:** `max-w-[60%]` of the **chat section** (the scrollable messages area).
- So a bubble can be at most **60% of the chat section width** (e.g. ~492px if chat is 820px).
- Also: `w-fit`, `px-3 py-1.5` (padding), so width grows with content up to that 60% cap.

---

## 3. Text message max size (inside bubble)

- Message text is wrapped in a div with **`max-w-[50%]`** = 50% of the **bubble** width.
- So the **text block** is at most **50% of the bubble** → effectively **30% of the chat section** (60% × 50% = 30%).

---

## 4. Messenger theme (for bubble colors)

- **Overall theme:** Purple + pink (gradients and accents).
- Examples: send button `from-purple-600 to-pink-500`, focus rings `purple-300` / `purple-600`, loading spinner `text-purple-600`, empty state `from-purple-100 to-pink-100`, etc.
- **Bubble color** should follow this: use **purple–pink gradient** instead of green so bubbles match the rest of the app.
