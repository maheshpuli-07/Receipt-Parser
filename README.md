# Receipt Parser

A full-stack web application that extracts structured data from receipt photos using AI and allows users to review, edit, and save the results.

## What This Does

Receipt Parser lets users upload a photo of a receipt (JPG or PNG) and automatically extracts:
- **Merchant name** - The store or restaurant
- **Date** - When the purchase was made
- **Line items** - Individual products/services with amounts
- **Total** - The final amount paid

The extracted data appears in an inline editor where users can correct any mistakes, then save the corrected receipt for later reference. Receipts persist locally in SQLite.

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React 18 + Vite + TypeScript
- **AI/LLM**: GPT-4o (via OpenAI API)
- **Storage**: SQLite (local, single-file database)
- **Image Processing**: Native browser File API + base64 encoding

## Setup & Running

### Prerequisites

- Node.js 18+ and npm
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

3. **Create your .env file**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...
   PORT=3001
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```

   This runs both the Express backend (port 3001) and Vite dev server (port 5173) concurrently.

5. **Open in browser**
   - Navigate to `http://localhost:5173`
   - Upload a receipt photo
   - Review and edit the extracted data
   - Save it

## Project Structure

```
src/
  ├── server.ts          # Express server, API endpoints
  ├── db.ts              # SQLite database layer
  ├── llm.ts             # Claude API integration
  ├── App.tsx            # Main React component
  ├── main.tsx           # Vite entry point
  └── components/
      ├── UploadForm.tsx     # File upload UI
      ├── ReceiptList.tsx    # List of saved receipts
      └── ReceiptEditor.tsx  # Inline editing & correction UI
  └── styles/
      └── App.css        # All styling

index.html              # HTML template
vite.config.ts          # Vite configuration
tsconfig.json           # TypeScript config
.env                    # Environment variables (not committed)
.env.example            # Template for .env
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
- Taxes (usually region-specific and user can add manually if needed)
- Delivery fees (not part of the product purchase)
- Tip lines (can be added as a separate item if user wants)

**Why**: Cleaner data structure. If a user needs tax/tip tracking, they can add it manually in the editor.

### 2. **LLM choice: GPT-4o**
I chose GPT-4o for:
- **Accuracy**: Best-in-class multimodal vision for receipt parsing
- **Cost**: Competitive pricing with good token efficiency
- **Speed**: Fast inference for real-time parsing
- **Tradeoff**: Requires OpenAI API key, but more accessible to most developers

### 3. **Error handling with LLM**
I use:
- **Structured JSON responses**: Claude returns a strict JSON schema, easier to parse
- **Confidence scores**: Claude rates its own confidence (0-1), helping users know what to scrutinize
- **Graceful fallbacks**: If parsing fails, we surface a generic "Failed to parse" error rather than crashing

**Alternative I considered**: Retry with a different model or prompt, but decided against it to keep latency low.

### 4. **Low-confidence extraction handling**
I display a confidence percentage badge on every receipt. For blurry/faded receipts:
- Claude's confidence score will be low (0.3-0.5)
- The UI makes this visible so users know to double-check
- Correction flow is fast and easy

**Alternative**: Block uploads under a threshold, but that's worse UX—let the user decide.

### 5. **Database choice: SQLite**
I used SQLite because:
- **Local persistence**: No server needed
- **Zero setup**: Single `.db` file
- **Sufficient for single-user**: This is a local app, not a SaaS
- **Tradeoff**: Can't scale horizontally, but that's out of scope

### 6. **Correction UX (most important piece)**
The editor is built for speed:
- **Inline editing**: No modal dialogs or page navigation
- **Add/remove items**: Easy to add forgotten items or remove duplicates
- **Auto-calculate total**: One click to recalculate from line items
- **Immediate feedback**: Save message shows success/failure
- **Visual hierarchy**: Merchant and date at top, items in a clean table, total at bottom

**Why this matters**: The LLM isn't perfect, but the human almost always is. Make it fast to fix.

## What I'd do with another week

1. **Batch processing**: Queue multiple receipts for processing (Claude API has a Batch API)
2. **Expense categorization**: Add a category field (Groceries, Dining, Gas, etc.) and tag line items
3. **Duplicate detection**: Warn if a very similar receipt was already saved (same merchant/date)
4. **Receipt image storage**: Keep a copy of the uploaded image for reference (currently discarded)
5. **Export**: CSV or JSON export of all receipts for expense tracking
6. **Mobile optimization**: Better responsive design for phone uploads
7. **OCR fallback**: If Claude fails, fall back to Tesseract.js for basic OCR
8. **Advanced search**: Filter receipts by merchant, date range, total amount range

## One Thing I'd Push Back On

**"Assume a single user."** In real product work, I'd push back on this because:

- Expense tracking is almost always multi-person (shared household, business team, expense reimbursement)
- Building auth from the start is ~30 minutes of extra work
- Single-user → multi-user is a painful migration later

However, I understand this is a take-home with a time constraint, so I built for single-user as specified. The code is structured to support auth later (each receipt has `createdAt`, not `createdBy`—easy to add).

## Testing

No formal test suite (per spec: "write tests where they'd actually catch something"). The correction flow is tested manually, and the API layer is simple enough that bugs surface quickly in dev.

## Environment Variables

| Variable | Required | Example |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | `sk-...` |
| `PORT` | No | `3001` |

## Browser Support

- Chrome/Edge: ✓
- Firefox: ✓
- Safari: ✓
- Mobile browsers: ✓ (responsive design)

## Known Limitations

- File upload size capped at 50MB (configurable in `server.ts`)
- Image format: JPG or PNG only
- No batch processing (single receipt at a time)
- No receipt image storage (image is discarded after parsing)

## License

MIT
