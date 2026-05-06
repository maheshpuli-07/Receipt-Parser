import React, { useRef, useState } from 'react';

interface UploadFormProps {
  onUploadSuccess: (receipt: any) => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please upload a JPG or PNG image');
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse receipt');
      }

      const receipt = await response.json();
      onUploadSuccess(receipt);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="upload-form">
      <div className="upload-box">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={isLoading}
          id="file-input"
        />
        <label htmlFor="file-input" className={isLoading ? 'disabled' : ''}>
          <div className="upload-icon">📸</div>
          <div className="upload-text">
            {isLoading ? 'Processing receipt...' : 'Click to upload or drag & drop'}
          </div>
          <div className="upload-subtext">JPG or PNG (max 50MB)</div>
        </label>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
