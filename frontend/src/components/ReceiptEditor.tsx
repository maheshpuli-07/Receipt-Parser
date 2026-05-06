import React, { useState } from 'react';

interface LineItem {
  name: string;
  amount: number;
}

interface Receipt {
  id: string;
  merchant: string;
  date: string;
  lineItems: LineItem[];
  total: number;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface ReceiptEditorProps {
  receipt: Receipt;
  onSave: (receipt: Receipt) => void;
  onDelete: () => void;
  onBack: () => void;
}

export default function ReceiptEditor({
  receipt,
  onSave,
  onDelete,
  onBack,
}: ReceiptEditorProps) {
  const [merchant, setMerchant] = useState(receipt.merchant);
  const [date, setDate] = useState(receipt.date);
  const [lineItems, setLineItems] = useState<LineItem[]>(receipt.lineItems);
  const [total, setTotal] = useState(receipt.total);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { name: '', amount: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (
    index: number,
    field: 'name' | 'amount',
    value: any
  ) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [field]: field === 'amount' ? parseFloat(value) || 0 : value,
    };
    setLineItems(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updatedReceipt: Receipt = {
        ...receipt,
        merchant: merchant.trim() || 'Unknown',
        date,
        lineItems: lineItems.filter((item) => item.name.trim()),
        total: parseFloat(total.toString()) || 0,
      };

      onSave(updatedReceipt);
      setSaveMessage('✓ Receipt saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage('✗ Failed to save receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2);
  };

  return (
    <div className="receipt-editor">
      <div className="editor-header">
        <button className="btn btn-back" onClick={onBack}>
          ← Back
        </button>
        <h2>Review & Edit Receipt</h2>
        <div className="confidence-indicator">
          Confidence: {(receipt.confidence * 100).toFixed(0)}%
        </div>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label htmlFor="merchant">Merchant Name</label>
          <input
            id="merchant"
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="Enter merchant name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Line Items</h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleAddLineItem}
            >
              + Add Item
            </button>
          </div>

          <div className="line-items-table">
            <div className="table-header">
              <div className="col-name">Item Name</div>
              <div className="col-amount">Amount</div>
              <div className="col-action">Action</div>
            </div>

            {lineItems.length === 0 ? (
              <div className="no-items">No items. Click "Add Item" to get started.</div>
            ) : (
              lineItems.map((item, index) => (
                <div key={index} className="table-row">
                  <input
                    className="col-name"
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleLineItemChange(index, 'name', e.target.value)
                    }
                    placeholder="Item name"
                  />
                  <input
                    className="col-amount"
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      handleLineItemChange(index, 'amount', e.target.value)
                    }
                    placeholder="0.00"
                    step="0.01"
                  />
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemoveLineItem(index)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="total">Total</label>
          <div className="total-input">
            <input
              id="total"
              type="number"
              value={total}
              onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              step="0.01"
            />
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setTotal(parseFloat(calculateTotal()))}
              title="Auto-calculate from line items"
            >
              Calculate from items
            </button>
          </div>
        </div>

        <div className="editor-footer">
          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('✓') ? 'success' : 'error'}`}>
              {saveMessage}
            </div>
          )}
          <div className="actions">
            <button
              className="btn btn-danger"
              onClick={onDelete}
              disabled={isSaving}
            >
              Delete Receipt
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
