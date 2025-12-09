'use client';

import { useState } from 'react';
import { exportData, importData } from '../../lib/storage';

export default function DataManagement() {
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoi4-tournament-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage({ type: 'success', text: 'Data exported successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleImport = () => {
    try {
      importData(importText);
      setMessage({ type: 'success', text: 'Data imported successfully! Refresh the page to see changes.' });
      setImportText('');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to import data. Please check the format.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setImportText(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Data Management</h2>
        <p className="text-zinc-400 mt-1">
          Export and import your tournament data for backup or transfer
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-900/20 border-green-800 text-green-300'
            : 'bg-red-900/20 border-red-800 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Export Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-zinc-200 mb-4">Export Data</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Download all your players and tournaments as a JSON file. This includes all tournament
          states, match results, and player information.
        </p>
        <button
          onClick={handleExport}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
        >
          Download Export File
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-zinc-200 mb-4">Import Data</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Upload a previously exported JSON file to restore your data. This will merge with your
          existing data.
        </p>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-amber-600 file:text-white file:cursor-pointer hover:file:bg-amber-500"
            />
          </div>

          {/* Or Paste JSON */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Or Paste JSON Data
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-48 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 font-mono text-xs focus:outline-none focus:border-amber-500"
              placeholder="Paste your exported JSON data here..."
            />
          </div>

          <button
            onClick={handleImport}
            disabled={!importText}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Data
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">Important Notes</h4>
        <ul className="text-blue-300/80 text-sm space-y-1 list-disc list-inside">
          <li>Exported data includes all players, tournaments, and match results</li>
          <li>Import will merge with existing data (duplicates may occur)</li>
          <li>Keep backups before importing to prevent data loss</li>
          <li>The page will refresh after successful import</li>
        </ul>
      </div>
    </div>
  );
}
