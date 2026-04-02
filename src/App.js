import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import PreviewPage from './PreviewPage';

function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [subIds, setSubIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [filterColumnName, setFilterColumnName] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please upload a file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subIds', subIds);
    formData.append('filterColumnName', filterColumnName);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${API_URL}/excel/upload`, formData);
      
      // Navigate to preview page with data
      navigate('/preview', { 
        state: { 
          previewData: response.data,
          resultId: response.data.resultId
        } 
      });
    } catch (error) {
      alert('Error processing file: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Excel Validator</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Upload Excel File:</label>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileChange}
            />
          </div>
          
          <div className="form-group">
            <label>Filter Column Name (Optional):</label>
            <input 
              type="text" 
              value={filterColumnName}
              onChange={(e) => setFilterColumnName(e.target.value)}
              placeholder="e.g., SubID, ExtraParam, CustomField"
            />
            <small>
              Leave empty to auto-detect (SubID, ExtraParam, etc.)
            </small>
          </div>

          <div className="form-group">
            <label>Enter IDs (comma-separated) - Optional:</label>
            <input 
              type="text" 
              value={subIds}
              onChange={(e) => setSubIds(e.target.value)}
              placeholder="e.g., 101, 102, 103 (leave empty to auto-detect)"
            />
            <small>
              Leave empty to automatically filter SubIDs with more than 10 records
            </small>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Preview Results'}
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<UploadPage />} />
      <Route path="/preview" element={<PreviewPage />} />
    </Routes>
  );
}

export default App;
