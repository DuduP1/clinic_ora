# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Three staff of Ora Clinic, an aesthetic-medicine boutique clinic in Herzliya (Sokolov 48, floor 2): Rotem (owner, admin), Liat and Neta (staff). They work at the reception desk and between treatments, often on a phone, in a bright clinic interior during the day. The defining moment: a customer calls or writes on WhatsApp, and staff must find her by phone number within seconds and act.

## Product Purpose
Internal CRM that replaces scattered notes: one customer record keyed by phone, appointments linked to it (scheduled / completed / cancelled), service tickets linked to it (new / in progress / closed, with an owner), and a management summary. Success: Rotem gets a reliable morning picture in under 2 minutes, and no ticket waits more than 24 hours without an owner.

## Positioning
Built for one small clinic's real routine, not a generic sales CRM: phone-first lookup from every screen, the day's appointments and unowned tickets as the morning picture, and an AI service agent ("Orit", CloudChat → n8n → this CRM's API) that opens tickets and answers "when is my next appointment?" from the same data.

## Operating Context
Reception desk computer and staff phones; incoming calls and WhatsApp messages; Hebrew-speaking customers; clinic hours Sun–Thu 09:00–19:00, Fri 09:00–13:00. Tickets also arrive from the AI agent (marked as source "agent").

## Capabilities and Constraints
- Next.js 16 (App Router), Supabase (Postgres, Auth, RLS), Tailwind v4, deployed on Vercel from `main`.
- Hebrew only, RTL, feminine address in UI copy ("נסי שוב"). Dates DD/MM/YYYY, 24h, Asia/Jerusalem.
- Mobile-first: 44px touch targets, bottom nav on mobile, side nav on desktop. Light and dark themes (cookie `theme`).
- Roles: admin (Rotem) can manage staff and delete records; staff cannot.
- Behavior source of truth: `../PRD - קליניקת אורה.md`.
- The live site is an exam submission under review: redesign work happens on branches only.

## Brand Commitments
- Name "קליניקת אורה". Logo: gold lotus with the Hebrew wordmark (`public/logo-full.png`, `public/logo-full-dark.png`, `public/logo-mark.png`, `src/app/icon.png`).

## Evidence on Hand
Demo data in Supabase: 12 customers, appointments Oct–Dec 2026, tickets #1001–#1023 (some opened by the agent). No real customer data, testimonials, or metrics; do not invent them.

## Product Principles
- Find the customer first: phone lookup is one keystroke away on every screen.
- The morning picture is the home screen: what is happening today and what is waiting without an owner.
- Nothing silent: every action confirms or explains its failure in plain Hebrew.
- Staff time is the scarce resource: fewer clicks beats more features.
