# Receipt Parser

A full-stack web application that extracts structured data from receipt photos using AI and allows users to review, edit, and save the results.

## What This Does

Receipt Parser lets users upload a photo of a receipt (JPG or PNG) and automatically extracts:

- **Merchant name** - The store or restaurant
- **Date** - When the purchase was made
- **Line items** - Individual products/services with amounts
- **Total** - The final amount paid

The extracted data appears in an inline editor where users can correct any mistakes, then save the corrected receipt for later reference. Receipts are persisted in **MongoDB** (database `receipt_parser`, collection `receipts`).

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React 18 + Vite + TypeScript
- **AI/LLM**: GPT-4o (via OpenAI API)
- **Storage**: MongoDB
- **Image Processing**: Native browser File API + base64 encoding

## Setup & Running

### Prerequisites

- Node.js 18+ and npm
- **MongoDB** running (default: `mongodb://localhost:27017`)
- An OpenAI API key (get one at https://platform.openai.com/api-keys)

### Quick Start

1. **Clone/navigate to the project**

   ```bash
   cd Handa_Assignment
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure the backend**

   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit `backend/.env`:

   ```env
   OPENAI_API_KEY=sk-...
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017
   ```

4. **Start development (from repo root)**

   ```bash
   cd ..
   npm run dev
   ```

   This runs the Express API (default port **3001**) and the Vite dev server (default **5173**) concurrently.

5. **Open in browser**

   - Navigate to `http://localhost:5173` (or the port Vite prints if 5173 is busy)
   - Upload a receipt photo, review/edit, and save

## Project Structure

Monorepo layout:

```
Handa_Assignment/
├── package.json           # npm workspaces; scripts to run both apps
├── backend/
│   ├── src/
│   │   ├── server.ts      # Express server, API endpoints
│   │   ├── db.ts          # MongoDB data access
│   │   └── llm.ts         # OpenAI / GPT-4o receipt parsing
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/    # UploadForm, ReceiptList, ReceiptEditor
│   │   └── styles/
│   ├── index.html
│   ├── vite.config.ts     # proxies /api → http://localhost:3001
│   └── package.json
└── README.md
```

## API Endpoints

### `POST /api/parse`

Uploads an image and extracts receipt data.

- **Input**: Multipart form data with `image` field
- **Output**: `{ id, merchant, date, lineItems, total, confidence, createdAt, updatedAt }`

### `PUT /api/receipts/:id`

Updates an existing receipt with corrected data.

- **Input**: JSON with updated fields
- **Output**: Updated receipt object

### `GET /api/receipts/:id`

Fetches a single receipt by ID.

### `GET /api/receipts`

Lists all saved receipts, sorted by creation date (newest first).

### `DELETE /api/receipts/:id`

Deletes a receipt.

## Key Decisions & Tradeoffs

### 1. **What counts as a line item?**

I include only actual products/services, excluding:

- Subtotals (redundant with line items)
- Taxes (usually region-specific; user can add manually if needed)
- Delivery fees (not part of the product purchase)
- Tip lines (can be added as a separate item if the user wants)

**Why**: Cleaner data structure. If a user needs tax/tip tracking, they can add it manually in the editor.

### 2. **LLM choice: GPT-4o**

I chose GPT-4o for:

- **Accuracy**: Strong multimodal vision for receipt parsing
- **Cost**: Competitive pricing with reasonable token usage
- **Speed**: Fast enough for interactive uploads

**Tradeoff**: Requires an OpenAI API key.

### 3. **Error handling with LLM**

I use:

- **Structured JSON responses**: The model returns a strict JSON shape for parsing
- **Confidence scores**: The model rates confidence (0–1), so users know what to double-check
- **Graceful fallbacks**: Parsing failures surface a clear error instead of crashing the server

### 4. **Low-confidence extraction handling**

I display a confidence percentage on every receipt. For blurry or faded receipts:

- The confidence score will be lower
- The UI makes that visible so users know to verify
- Correction flow is quick

**Alternative**: Block uploads under a threshold—worse UX; letting the user decide is better.

### 5. **Database choice: MongoDB**

Receipts are stored in MongoDB because:

- **Natural fit for documents**: Each receipt is a JSON-shaped document (line items, metadata)
- **Easy to extend**: New fields without migrations-heavy workflows for this app size
- **Local or hosted**: Same driver works against `localhost` or Atlas

**Tradeoff**: You must run MongoDB (or point `MONGODB_URI` at a hosted cluster).

### 6. **Correction UX**

The editor is built for speed:

- **Inline editing**: No extra modals for basic edits
- **Add/remove items**: Fix omissions or duplicates quickly
- **Auto-calculate total**: One click from line items
- **Save feedback**: Success/error message after save

**Why this matters**: The model is not perfect; making human fixes fast is the main product value.

## What I'd do with another week

1. **Batch processing**: Queue multiple receipts
2. **Expense categorization**: Categories/tags per receipt or line item
3. **Duplicate detection**: Warn on similar merchant/date/total
4. **Receipt image storage**: Optional storage of originals (today temp files are removed after parse)
5. **Export**: CSV/JSON export
6. **Mobile polish**: Even tighter layouts for phone cameras
7. **Advanced search**: Filters by merchant, date range, amount

## Testing

No formal test suite in this repo. The correction flow is validated manually; the API surface is small and breaks are obvious in development.

## Environment Variables

Backend (`backend/.env`):

| Variable | Required | Example |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | `sk-...` |
| `PORT` | No | `3001` |
| `MONGODB_URI` | No | `mongodb://localhost:27017` |

## Browser Support

- Chrome/Edge: ✓
- Firefox: ✓
- Safari: ✓
- Mobile browsers: ✓ (responsive layout)

## Known Limitations

- Upload size capped at 50MB (configurable in `backend/src/server.ts`)
- Image format: JPG or PNG only
- No batch processing (single receipt at a time)
- Parsed image is not kept after processing (by design in current flow)

## License

MIT
