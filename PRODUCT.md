# PRODUCT – CRM קליניקת אורה

## What it is
Internal CRM for Ora Clinic, an aesthetic-medicine boutique clinic in Herzliya (Sokolov 48, floor 2). Customers, appointments, service tickets, a management summary, and a secured API that the AI service agent "Orit" (CloudChat → n8n) uses to open tickets and read a customer's next appointment.

## Users and scene
Three staff: Rotem (owner/admin), Liat and Neta (staff). Used at the reception desk and between treatments, in a bright clinic interior during the day, often on a phone. Typical moment: a customer calls or writes on WhatsApp, and staff must find her by phone number in seconds.

## Jobs
- Find a customer by phone from any screen and see her history and next appointment.
- Book / update appointments (scheduled / completed / cancelled).
- Open, assign and close service tickets (new / in progress / closed); nothing waits >24h without an owner.
- Rotem: a reliable morning picture in under 2 minutes.

## Constraints
- Hebrew only, RTL, feminine address ("נסי שוב"). Dates DD/MM/YYYY, 24h, Asia/Jerusalem.
- Mobile-first; 44px touch targets; bottom nav on mobile, side nav on desktop.
- Light and dark themes (cookie `theme`).
- Source of truth for behavior: `../PRD - קליניקת אורה.md`.

## Brand commitments
- Logo: gold lotus with the Hebrew wordmark "קליניקת אורה" (`public/logo-*.png`).
- Visual world: "Boutique gold" (chosen by the owner, 22/10/2026) – see DESIGN.md once written.
