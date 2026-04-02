import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './PreviewPage.css';

function PreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [resultId, setResultId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (location.state && location.state.previewData) {
      console.log('Preview page loaded with data:', {
        resultId: location.state.resultId,
        sheetsCount: location.state.previewData.sheets.length
      });
      setPreviewData(location.state.previewData);
      setResultId(location.state.resultId);
      
      // Auto-select the sheet with the most records
      const sheets = location.state.previewData.sheets;
      if (sheets && sheets.length > 0) {
        let maxRecords = 0;
        let maxIndex = 0;
        
        sheets.forEach((sheet, index) => {
          if (sheet.data && sheet.data.length > maxRecords) {
            maxRecords = sheet.data.length;
            maxIndex = index;
          }
        });
        
        setSelectedSheet(maxIndex);
      }
    } else {
      // If no data, redirect back to home
      console.log('No preview data found, redirecting to home');
      navigate('/');
    }
  }, [location, navigate]);

  const handleDownload = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${API_URL}/excel/download`, 
        { resultId },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'filtered_results.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Error downloading file: ' + error.message);
    }
  };

  const handleDownloadSheet = async () => {
    try {
      console.log('Download clicked - ResultId:', resultId, 'SheetIndex:', selectedSheet);
      
      if (!resultId) {
        alert('Error: No result ID found. Please go back and upload the file again.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await axios.post(`${API_URL}/excel/download-sheet`, 
        { resultId, sheetIndex: selectedSheet },
        { responseType: 'blob' }
      );

      console.log('Download response received:', response.status);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${previewData.sheets[selectedSheet].name}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      if (error.response) {
        alert(`Error downloading sheet: ${error.response.status} - ${error.response.statusText}`);
      } else {
        alert('Error downloading sheet: ' + error.message);
      }
    }
  };

  const handleSheetChange = (e) => {
    const selectedIndex = parseInt(e.target.value);
    setSelectedSheet(selectedIndex);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Auto-select first matching sheet when searching
    if (term && previewData) {
      const sortedSheets = [...previewData.sheets]
        .map((sheet, originalIndex) => ({ ...sheet, originalIndex }))
        .sort((a, b) => b.data.length - a.data.length);
      
      const filteredSheets = sortedSheets.filter(sheet => 
        sheet.name.toLowerCase().includes(term.toLowerCase()) ||
        (sheet.subId && sheet.subId.toLowerCase().includes(term.toLowerCase()))
      );
      
      if (filteredSheets.length > 0) {
        setSelectedSheet(filteredSheets[0].originalIndex);
      }
    }
  };

  if (!previewData) {
    return <div>Loading...</div>;
  }

  // Sort sheets by row count (descending)
  const sortedSheets = [...previewData.sheets]
    .map((sheet, originalIndex) => ({ ...sheet, originalIndex }))
    .sort((a, b) => b.data.length - a.data.length);

  // Filter sheets based on search term
  const filteredSheets = sortedSheets.filter(sheet => 
    sheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sheet.subId && sheet.subId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentSheet = previewData.sheets[selectedSheet];

  // Generate distinct colors for charts
  const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E63946', '#06FFA5', '#118AB2', '#FF9F1C', '#2EC4B6',
    '#E76F51', '#8338EC', '#3A86FF', '#FB5607', '#06D6A0',
    '#D62828', '#F77F00', '#003049', '#669BBC', '#C1121F'
  ];

  // Sort all sheets by record count and get top 10
  const top10Sheets = [...previewData.sheets]
    .sort((a, b) => b.data.length - a.data.length)
    .slice(0, 10);

  // Prepare data for pie chart (top 10 only)
  const chartData = top10Sheets.map((sheet, index) => ({
    name: sheet.subId || sheet.name,
    value: sheet.data.length,
    fullName: sheet.name,
    color: COLORS[index % COLORS.length]
  }));

  // Prepare data for bar chart (top 10 only)
  const barChartData = top10Sheets.map((sheet, index) => ({
    name: (sheet.subId || sheet.name).substring(0, 20), // Truncate long names
    value: sheet.data.length,
    fullName: sheet.name,
    color: COLORS[index % COLORS.length]
  }));

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px 16px',
          border: '2px solid rgb(105, 22, 222)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: 0, fontWeight: 700, color: '#2c3e50', fontSize: '14px' }}>
            {payload[0].payload.fullName}
          </p>
          <p style={{ margin: '4px 0 0 0', color: 'rgb(105, 22, 222)', fontWeight: 600, fontSize: '13px' }}>
            Records: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="preview-page">
      <div className="preview-container">
        <div className="preview-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back to Upload
          </button>
          <h1>Preview Results</h1>
        </div>

        <div className="analytics-section">
          <h2 className="analytics-title">📊 Data Distribution Analytics</h2>
          <div className="charts-wrapper">
            <div className="chart-box">
              <h3 className="chart-subtitle">Distribution Overview</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-box">
              <h3 className="chart-subtitle">Top 10 SubIDs by Records</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={barChartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#666"
                    tick={false}
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis 
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {barChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="sheet-selector-section">
          <div className="selector-row">
            <div className="search-box">
              <label className="search-label">
                <span className="label-icon">🔍</span>
                Search Using SubID or Sheet Name:
              </label>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search" 
                    onClick={() => setSearchTerm('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchTerm && (
                <div className="search-results-info">
                  <span className="results-icon">✓</span>
                  Found {filteredSheets.length} matching sheet{filteredSheets.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className="dropdown-section">
              <label className="dropdown-label">
                <span className="label-icon">📊</span>
                Select Sheet to Preview ({filteredSheets.length} sheets):
              </label>
              <select 
                value={selectedSheet} 
                onChange={handleSheetChange}
                className="sheet-dropdown"
              >
                {filteredSheets.map((sheet) => (
                  <option key={sheet.originalIndex} value={sheet.originalIndex}>
                    {sheet.name} ({sheet.data.length} rows)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {currentSheet && (
          <div className="sheet-preview">
            <div className="sheet-header">
              <div className="sheet-info">
                <h3>{currentSheet.name}</h3>
                <span className="row-count">
                  📊 {currentSheet.data.length} rows
                </span>
              </div>
              <button 
                type="button" 
                className="download-sheet-btn" 
                onClick={handleDownloadSheet}
              >
                📥 Download This Sheet
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {currentSheet.data.length > 0 &&
                      Object.keys(currentSheet.data[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSheet.data.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((value, i) => (
                        <td key={i}>{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewPage;
