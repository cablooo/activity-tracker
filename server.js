const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

app.get('/api/data', (req, res) => {
  const dataPath = 'C:\\Users\\yoski\\Documents\\activity tracker\\activity_data.json';
  
  console.log('Looking for file at:', dataPath);
  
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      res.status(500).json({ error: 'Could not read file', path: dataPath });
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});