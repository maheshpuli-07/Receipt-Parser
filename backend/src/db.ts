import { MongoClient, Db, Collection } from 'mongodb';

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'receipt_parser';
const collectionName = 'receipts';

let client: MongoClient;
let db: Db;
let receiptsCollection: Collection;

export interface Receipt {
  id: string;
  merchant: string;
  date: string;
  lineItems: Array<{ name: string; amount: number }>;
  total: number;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export async function initializeDb(): Promise<void> {
  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    receiptsCollection = db.collection(collectionName);
    
    await receiptsCollection.createIndex({ id: 1 }, { unique: true });
    await receiptsCollection.createIndex({ createdAt: -1 });
    
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function saveReceipt(receipt: Receipt): Promise<void> {
  try {
    await receiptsCollection.updateOne(
      { id: receipt.id },
      { $set: receipt },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error saving receipt:', error);
    throw error;
  }
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  try {
    const receipt = await receiptsCollection.findOne({ id });
    return receipt as Receipt | null;
  } catch (error) {
    console.error('Error getting receipt:', error);
    throw error;
  }
}

export async function getAllReceipts(): Promise<Receipt[]> {
  try {
    const receipts = await receiptsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return receipts.map(doc => ({
      id: doc.id,
      merchant: doc.merchant,
      date: doc.date,
      lineItems: doc.lineItems,
      total: doc.total,
      confidence: doc.confidence,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })) as Receipt[];
  } catch (error) {
    console.error('Error getting receipts:', error);
    throw error;
  }
}

export async function deleteReceipt(id: string): Promise<void> {
  try {
    await receiptsCollection.deleteOne({ id });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    throw error;
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
  }
}
