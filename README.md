# SplitSnap

Split bills without the drama. A small static website that splits one shared bill equally or by custom amounts, with tip and extra charges.

## Features

- Bill calculator: bill name, amount, currency (PKR, USD, EUR, GBP, INR), 2 to 20 people, tip percentage, fixed extra charges
- Equal split and custom split (custom base amounts must add up to the subtotal)
- Tip and extra charges shared proportionally in custom mode, evenly in equal mode
- Integer minor-unit maths with deterministic leftover rounding, so shares always add up exactly to the grand total
- Copy summary in WhatsApp-friendly plain text
- History saved in browser localStorage: reopen or delete individual bills, clear all with confirmation
- Light and dark themes, persisted in the browser
- Responsive layout, keyboard navigation, visible focus, labelled form controls

## Use

Open `index.html` in a browser, or serve this folder with any static file server. No build step, no backend, no account.

## Privacy

All data stays in the browser. Nothing is sent to a server.
