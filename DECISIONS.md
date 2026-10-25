# Decisions.md

> Live Website Link: https://kghildial-aria-design.vercel.app/

# Small integration changes in the host app that complement the solution:

- The nav animation:
  - Absent in the base host app.
  - I added UX on the desktop and deigned it's variant in mobile.
- Desktop layout changed to take summary metrics on the side panel to provide always available glance:
  - This panel also contains chat history toggle.
  - On Mobile: the "Team Overview" section remains on the dashboard during first load with a collapsible option once they become a distraction.
  - Right side menu on mobile houses the same.
- Chat history is a right hand side toggle menu globally, apart form when desktop chat is expanded.

---

# Extracted design system in Figma from the host app codebase:

> [Figma - Token Reference](https://www.figma.com/design/aiIn9zI1uWBhACgaWYfDVp/AI-Assistant-coaching-answer--Lead-Design-Engineer-take-home?node-id=7-121&t=j81MmNVGLLVMROw4-1)

> [Figma - User Flows](https://www.figma.com/design/aiIn9zI1uWBhACgaWYfDVp/AI-Assistant-coaching-answer--Lead-Design-Engineer-take-home?node-id=351-17414&t=j81MmNVGLLVMROw4-1)

---

# Changes to the frontend setup:

To support modularity and accessibility of the codebase and accommodate faster design to development iterations and prototypes:

> [Figma - Visual map of the Codebase](https://www.figma.com/design/aiIn9zI1uWBhACgaWYfDVp/AI-Assistant-coaching-answer--Lead-Design-Engineer-take-home?node-id=351-17416&t=j81MmNVGLLVMROw4-1)

- **Setup Tailwind, ShadCN, & framer motion.**
- The base styles.css had token names that matched the ones in ShadCN.
- Interleaved existing tokens (design system) in the codebase with Tailwind's styling layers.
- **Setup motion values as a separate module for quick prototyping in code.**
- **Framer motion:** The `motion` package:
  - Provides accessibility wrappers for `prefers-reduced-motion`.
  - Controls exit animations and provides reverse animations on unmount.
- **ShadCN & Radix support** provides code primitives for common components like a toast notification, button, sheet etc.
- **Tailwind good for quick prototyping** with support for extending & managing the design system styles in codebase.
- **Vite** - Utilizing `vitest` for **unit testing and test driven development**, wherever needed.
- Fully typed and readable with **JSDoc Styled comments**.

---

## The Core Experience:

- Core Experience happens in the form of a chat modal that appears when interacting with the chatbox.
- The response inside this modal is streamed-in, coherently without layout shift.

> Provided screen-recordings of desktop and mobile in the email thread.
> Live link at the top of this file.

### Meaningful interactions in the coaching card:

- **Pin to dashboard:**
  - Each question answer sessions contains the coaching card which provides insights for progress and next steps.
  - Hence I designed the option for it to be pinned to the dashboard for future reference and quick view.
- **Expand on desktop:**
  - Since **desktops have more real-estate** to work with, taking advantage of this, there is an **expand option in the chat panel** which allows for the panel to grow and show a comprehensive chat modal with built in history panel on the side, the design is attempting to provide a "focus-mode" like experience with power user moves like having chat history right next to the chats.
  - Works in tandem with the existing chat-box at the bottom.
- On mobile the chat panel is already full screen modal.
- **I designed the motion to be fluid, continuous and purposeful to enhance the user experience without being flamboyant to avoid distractions.**

### Small enhancements that strengthen the concept:

- **Graceful handling of asynchronous AI responses:**
  - If the user closes the chat panel while an answer is in progress or loading, there is an answer ready flag that appears with pulsing animations to **inform that the answer is ready to view.**
- **The send button in the chat box is repurposed with motion**:
  - It was a static up facing arrow by default, I design the animations for it which provide meaning to the AI assistant interactions:
  - **Up arrow** means, Open the Assistant Panel
  - **Down arrow** means Close it
  - These are especially **useful in mobile to open model without making the on screen keyboard appear**.
  - **When there is text in the chat-box** the button arrow points to the text and acts as a real send message button.
- **The new chat button** (blue plus button) pops in only when user is in an existing chat to provide a quick way to create a new chat.
  - It's **positioning** on the right of the text box is on purpose to provide quick **access on mobile with the thumb**.
  - This position is meaningful in the desktop as well so that the user doesn't confuse it with an "attach files to chat" button (if that comes in the future).
- **Pin animations are directional** and show the coaching card being pinned to the dashboard so that the action is deliberate and communicates the change in the UI clearly.
- **The AI assistant chat panel has memory in form**: "Expanded" or "Collapsed" preferences persist through closure and response.
- **The base shell has no UX for the left hand nav**: I added that as well as designed a mobile version for the same.

### Accessibility: WCAG, a11y and ARIA-roles:

- Taken **WCAG contract** standards into mind while designing.
- **Focus management:** Keyboard focus shifts between the Panel and the chat and other toggles as required.
- **Screen reader friendly**: ARIA roles on various key elements to curate the screen readers.
- `prefers-reduced-motion`: Added support in the codebase, built into the motion layer.
