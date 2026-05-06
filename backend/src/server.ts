import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { initializeDb, saveReceipt, getReceipt, getAllReceipts, deleteReceipt, closeDb } from './db.js';
import { parseReceiptImage } from './llm.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'));
    }
  },
});

app.post('/api/parse', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    const parsed = await parseReceiptImage(base64Image);

    const receipt = {
      id: randomUUID(),
      merchant: parsed.merchant,
      date: parsed.date,
      lineItems: parsed.lineItems,
      total: parsed.total,
      confidence: parsed.confidence,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveReceipt(receipt);

    fs.unlinkSync(req.file.path);

    res.json(receipt);
  } catch (error) {
    console.error('Error parsing receipt:', error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    }
    res.status(500).json({ error: 'Failed to parse receipt' });
  }
});

app.put('/api/receipts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receipt = await getReceipt(id);

    if (!receipt) {
      res.status(404).json({ error: 'Receipt not found' });
      return;
    }

    const updated = {
      ...receipt,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    await saveReceipt(updated);
    res.json(updated);
  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({ error: 'Failed to update receipt' });
  }
});

app.get('/api/receipts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receipt = await getReceipt(id);

    if (!receipt) {
      res.status(404).json({ error: 'Receipt not found' });
      return;
    }

    res.json(receipt);
  } catch (error) {
    console.error('Error getting receipt:', error);
    res.status(500).json({ error: 'Failed to get receipt' });
  }
});

app.get('/api/receipts', async (req: Request, res: Response) => {
  try {
    const receipts = await getAllReceipts();
    res.json(receipts);
  } catch (error) {
    console.error('Error getting receipts:', error);
    res.status(500).json({ error: 'Failed to get receipts' });
  }
});

app.delete('/api/receipts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteReceipt(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ error: 'Failed to delete receipt' });
  }
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

async function start() {
  try {
    await initializeDb();
    const server = app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, closing connections...');
      server.close(async () => {
        await closeDb();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, closing connections...');
      server.close(async () => {
        await closeDb();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
