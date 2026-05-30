# Level One — Voice Intelligence CRM

A production-ready Next.js (App Router) application serving as a webhook processor for an AI voice agent and a frontend CRM dashboard. Built for deployment on Vercel.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with glassmorphism design
- **Database**: Firebase Firestore (via Admin SDK)
- **AI Voice**: Retell AI SDK
- **Telephony**: Telnyx Call Control
- **Automation**: Make.com webhooks

## Architecture Overview

```
Inbound Call → Telnyx Webhook → Reject + Trigger Retell Outbound Call
                                        ↓
                              Retell AI Voice Agent
                                        ↓
                         Retell Webhook (call_analyzed)
                          /              \
               Firebase Firestore     Make.com Webhook
               (stores call record)   (triggers follow-up email)
                          ↓
                   CRM Dashboard
         (Overview / Calls / Pipeline / Control)
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `RETELL_API_KEY` | Your Retell AI API key |
| `RETELL_AGENT_ID` | The Retell Agent ID to use for outbound calls |
| `RETELL_LLM_ID` | The Retell LLM ID for system prompt updates |
| `TELNYX_API_KEY` | Your Telnyx API key |
| `TELNYX_FROM_NUMBER` | Your Telnyx phone number (e.g. +14157774444) |
| `MAKE_WEBHOOK_URL` | Make.com scenario webhook URL |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `INTERNAL_API_SECRET` | Random secret for internal API auth |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/webhooks/telnyx` | POST | Handles inbound call events — rejects call & triggers Retell outbound |
| `/api/webhooks/retell` | POST | Handles `call_analyzed` — saves to Firestore & fires Make.com webhook |
| `/api/update-script` | POST | Updates the Retell LLM system prompt |
| `/api/get-script` | GET | Retrieves the current Retell LLM system prompt |
| `/api/calls` | GET | Fetches all call records from Firestore |
| `/api/calls/update-status` | POST | Updates consultation status for a lead |

## Dashboard Pages

| Page | Route | Description |
|---|---|---|
| Overview | `/dashboard` | Metric cards: Total Calls, Leads, Sentiment, Consultations |
| Call Intelligence | `/dashboard/calls` | Full call log with transcript modal |
| CRM Pipeline | `/dashboard/pipeline` | Lead pipeline with consultation status tracking |
| System Control | `/dashboard/control` | Live Retell prompt editor |

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment to Vercel

1. Push this repository to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables in Vercel Project Settings → Environment Variables
4. Deploy

## Webhook Configuration

### Telnyx
Set your Telnyx webhook URL to:
```
https://your-domain.vercel.app/api/webhooks/telnyx
```

### Retell
Set your Retell webhook URL to:
```
https://your-domain.vercel.app/api/webhooks/retell
```

## Firestore Structure

Each document in the `calls` collection has the following shape:

```json
{
  "call_id": "string",
  "from_number": "string",
  "transcript": "string",
  "recording_url": "string",
  "call_status": "string",
  "sentiment": "string",
  "duration_seconds": 0,
  "created_at": "ISO 8601 string",
  "lead_name": "string",
  "lead_email": "string",
  "business_type": "string",
  "ai_objective": "string",
  "implementation_type": "string",
  "consultation_status": "pending | scheduled | completed | not_interested"
}
```
