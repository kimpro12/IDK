# Architecture

## Module Breakdown
- **app/**: Expo Router screens and navigation layout.
- **src/components/**: Shared UI building blocks (cards, buttons, inputs).
- **src/services/**: Data access, notifications, and storage wrappers.
- **src/lib/**: Utility functions, formatting helpers, and feature flags.
- **src/data/**: Static content packs and seed data.
- **src/types/**: TypeScript types and domain interfaces.

## Data Model
- **SignPack**
  - `id`: string
  - `title`: string
  - `description`: string
  - `entries`: SignEntry[]
- **SignEntry**
  - `id`: string
  - `title`: string
  - `prompt`: string
  - `tags`: string[]
- **JournalEntry**
  - `id`: string
  - `createdAt`: ISO string
  - `promptId`: string
  - `reflection`: string
  - `mood`: 'low' | 'steady' | 'high'

## Storage Choices
- **AsyncStorage** for lightweight preferences (theme, reminders, last pack).
- **SQLite** for journal entries and history to allow offline access.
- **Static JSON** in `src/data` for bundled packs and default prompts.
- **Expo Notifications** scheduled locally for reminder nudges.
