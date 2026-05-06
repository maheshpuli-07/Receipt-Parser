import React from 'react';

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

interface ReceiptListProps {
  receipts: Receipt[];
  onSelectReceipt: (receipt: Receipt) => void;
  onDeleteReceipt: (id: string) => void;
}

export default function ReceiptList({
  receipts,
  onSelectReceipt,
  onDeleteReceipt,
}: ReceiptListProps) {
  if (receipts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h2>No receipts yet</h2>
        <p>Upload a receipt photo to get started</p>
      </div>
    );
  }

  return (
    <div className="receipt-list">
      <h2>Saved Receipts</h2>
      <div className="receipts-grid">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="receipt-card">
            <div className="receipt-header">
              <h3>{receipt.merchant}</h3>
              <div className="confidence-badge">
                {(receipt.confidence * 100).toFixed(0)}% confident
              </div>
            </div>
            <div className="receipt-details">
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">{receipt.date}</span>
              </div>
              <div className="detail-row">
                <span className="label">Items:</span>
                <span className="value">{receipt.lineItems.length}</span>
              </div>
              <div className="detail-row">
                <span className="label">Total:</span>
                <span className="value amount">${receipt.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="receipt-actions">
              <button
                className="btn btn-primary"
                onClick={() => onSelectReceipt(receipt)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onDeleteReceipt(receipt.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
