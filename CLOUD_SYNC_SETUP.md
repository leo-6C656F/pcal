# Cloud Sync Setup Guide

This guide explains how to set up and use the cloud synchronization feature for PCAL.

## Overview

PCAL now supports **optional** cloud sync using Vercel Postgres. This allows you to:
- Back up your data to the cloud
- Access your data from multiple devices
- Sync children, daily entries, and custom goals

**Important:** Cloud sync is completely optional. PCAL continues to work 100% offline using IndexedDB. You can choose to enable cloud sync only if you want multi-device access.

## Prerequisites

1. **Vercel Account** - You need a Vercel account to use Vercel Postgres
2. **Clerk Authentication** - Users must be signed in to use cloud sync
3. **Vercel Postgres Database** - Free tier provides 512 MB storage

## Setup Instructions

### 1. Create Vercel Postgres Database

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your PCAL project
3. Go to the "Storage" tab
4. Click "Create Database"
5. Select "Postgres" (powered by Neon)
6. Choose a name for your database (e.g., "pcal-db")
7. Select a region close to your users
8. Click "Create"

### 2. Connect Database to Project

Vercel will automatically add the following environment variables to your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

These are automatically available to your Vercel Functions.

### 3. Initialize Database Schema

After deploying your project with the cloud sync code:

1. Visit: `https://www.pcal.online/api/db-init`
2. This will create all necessary tables and indexes
3. You should see: `{"success": true, "message": "Database initialized successfully..."}`

**Note:** You only need to run this once. The schema includes:
- `users` table (linked to Clerk user IDs)
- `children` table
- `daily_entries` table
- `goals` table

### 4. Verify Setup

1. Sign in to PCAL
2. Go to Settings → Cloud Sync tab
3. Enable "Cloud Sync"
4. Click "Push to Cloud"
5. Check the browser console for success messages

## Usage

### Enabling Cloud Sync

1. **Sign in** - You must be authenticated with Clerk
2. **Go to Settings** - Navigate to Settings page
3. **Open Cloud Sync tab** - Click on the "Cloud Sync" tab
4. **Toggle sync** - Enable the "Enable Cloud Sync" switch
5. **Initial sync** - Click "Push to Cloud" to upload your existing data

### Manual Sync Operations

#### Push to Cloud (Backup)
- Uploads all local data (children, entries, goals) to the cloud
- Overwrites cloud data with local data
- Use this to back up your data or after making local changes

#### Pull from Cloud (Restore)
- Downloads all cloud data to this device
- Merges cloud data into local IndexedDB
- Use this on a new device or to restore from backup

### Automatic Sync

Currently, cloud sync is **manual only**. You must click the sync buttons to push or pull data.

**Future enhancement:** Automatic background sync can be added later.

## Data Flow

```
┌─────────────────────┐
│  User's Browser     │
│  (IndexedDB)        │
│  - children         │
│  - dailyEntries     │
│  - goals            │
└──────────┬──────────┘
           │
           │ Push to Cloud (POST /api/sync)
           │ Pull from Cloud (GET /api/sync)
           ↓
┌─────────────────────┐
│  Vercel Functions   │
│  /api/sync          │
│  (Edge Runtime)     │
└──────────┬──────────┘
           │
           │ Authenticated via Clerk
           │ User ID from JWT token
           ↓
┌─────────────────────┐
│  Vercel Postgres    │
│  (Neon)             │
│  - users            │
│  - children         │
│  - daily_entries    │
│  - goals            │
└─────────────────────┘
```

## Security

- **Authentication Required** - All sync operations require a valid Clerk session token
- **User Isolation** - Data is partitioned by Clerk user ID
- **HTTPS Only** - All API requests use HTTPS
- **Row-Level Security** - Each user can only access their own data

## Database Schema

### users
- `clerk_user_id` (PK) - Clerk user ID
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_sync_at` - Last sync timestamp

### children
- `id` (PK) - UUID
- `user_id` (FK) - References users.clerk_user_id
- `name` - Child's name
- `center` - Center/school name
- `teacher` - Teacher's name
- `created_at`, `updated_at`, `deleted_at`

### daily_entries
- `id` (PK) - UUID
- `user_id` (FK) - References users.clerk_user_id
- `date` - Entry date (YYYY-MM-DD)
- `child_id` - Child UUID
- `lines` (JSONB) - Activity lines array
- `signature_base64` - Parent signature
- `ai_summary` - AI-generated summary
- `ai_summary_provider` - AI provider used
- `is_locked` - Lock status
- `emailed_at` - Email timestamp
- `created_at`, `updated_at`, `deleted_at`

### goals
- `code` (PK) - Goal code number
- `user_id` (PK, FK) - References users.clerk_user_id
- `description` - Goal description
- `activities` (JSONB) - Activities array
- `created_at`, `updated_at`, `deleted_at`

## Troubleshooting

### "Not authenticated" Error
- Make sure you're signed in with Clerk
- Check that your session hasn't expired
- Try signing out and signing back in

### Sync Failed
- Check browser console for detailed error messages
- Verify database is initialized (`/api/db-init`)
- Check Vercel function logs in Vercel dashboard
- Ensure environment variables are set correctly

### No Data Synced
- Verify you have local data in IndexedDB
- Check the "Last synced" timestamp
- Try manual "Push to Cloud" first, then "Pull from Cloud" on another device

### Database Connection Error
- Verify Vercel Postgres is created and connected
- Check environment variables in Vercel dashboard
- Ensure you're on a Vercel deployment (not local dev)

## Local Development

For local development, cloud sync will not work unless you:

1. Set up local environment variables (`.env.local`):
   ```
   POSTGRES_URL="postgres://..."
   CLERK_SECRET_KEY="sk_test_..."
   ```

2. Or disable cloud sync during development (it will work offline)

## Cost

**Vercel Postgres Free Tier:**
- 512 MB storage
- 3 GB data transfer/month
- Sufficient for hundreds of users

**Estimated Usage:**
- Average entry: ~2-5 KB
- 1000 entries: ~2-5 MB
- Free tier supports: ~100-250K entries

## Architecture Decisions

### Why Manual Sync?
- User control over data sync timing
- Avoids conflicts from simultaneous edits
- Reduces API calls and costs
- Simpler implementation

### Why Vercel Postgres?
- Easy Vercel integration
- Free tier included
- Automatic connection pooling
- No separate database hosting needed

### Why Optional?
- Privacy: users may prefer local-only data
- Offline-first: app works without internet
- Progressive enhancement: sync is a bonus feature

## Future Enhancements

Potential features to add:
- [ ] Automatic background sync
- [ ] Conflict resolution (last-write-wins or merge)
- [ ] Selective sync (choose what to sync)
- [ ] Sync history/audit log
- [ ] Real-time sync with WebSockets
- [ ] Encryption at rest

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Vercel function logs
3. Verify database connection
4. Open an issue on GitHub
