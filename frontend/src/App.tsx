import React, { useState, useEffect } from 'react';
import './styles/App.css';
import UploadForm from './components/UploadForm';
import ReceiptList from './components/ReceiptList';
import ReceiptEditor from './components/ReceiptEditor';

interface Receipt {
  id: string;
  merchant: string;
  date: string;
  lineItems: Array<{ name: string; amount: number }>;
  total: number;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

function App() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const response = await fetch('/api/receipts');
      const data = await response.json();
      setReceipts(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (receipt: Receipt) => {
    setReceipts([receipt, ...receipts]);
    setSelectedReceipt(receipt);
  };

  const handleSaveReceipt = async (updatedReceipt: Receipt) => {
    try {
      const response = await fetch(`/api/receipts/${updatedReceipt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReceipt),
      });
      const data = await response.json();
      setReceipts(receipts.map((r) => (r.id === data.id ? data : r)));
      
      // Automatically switch to receipts list after successful save
      setTimeout(() => {
        setSelectedReceipt(null);
      }, 500);
    } catch (error) {
      console.error('Error saving receipt:', error);
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    try {
      await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      setReceipts(receipts.filter((r) => r.id !== id));
      if (selectedReceipt?.id === id) {
        setSelectedReceipt(null);
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📄 Receipt Parser</h1>
        <p>Extract structured data from receipt photos</p>
      </header>

      <div className="app-container">
        <div className="upload-section">
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        </div>

        <div className="main-content">
          {isLoading ? (
            <div className="loading">Loading receipts...</div>
          ) : selectedReceipt ? (
            <ReceiptEditor
              receipt={selectedReceipt}
              onSave={handleSaveReceipt}
              onDelete={() => {
                handleDeleteReceipt(selectedReceipt.id);
              }}
              onBack={() => setSelectedReceipt(null)}
            />
          ) : (
            <ReceiptList
              receipts={receipts}
              onSelectReceipt={setSelectedReceipt}
              onDeleteReceipt={handleDeleteReceipt}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
