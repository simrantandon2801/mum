const express = require('express');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
const dataFolderPath = './data';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cardStatusDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema for the card data
const cardSchema = new mongoose.Schema({
  card_id: String,
  status: String,
});

// Create a Card model based on the schema
const Card = mongoose.model('Card', cardSchema);

// Load CSV files into the MongoDB database
fs.readdirSync(dataFolderPath).forEach(file => {
  const filePath = `${dataFolderPath}/${file}`;
  if (fs.lstatSync(filePath).isFile() && file.endsWith('.csv')) {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Create a new document for each row in the CSV and save it to the database
        const card = new Card({
          card_id: row.card_id,
          status: row.status,
        });
        card.save();
      });
  }
});

// Define the endpoint
app.get('/get_card_status', async (req, res) => {
  const phoneNumber = req.query.phone_number;
  const cardId = req.query.card_id;

  if (!phoneNumber && !cardId) {
    return res.status(400).json({ error: 'Either phone_number or card_id must be provided' });
  }

  try {
    let result;
    if (phoneNumber) {
      result = await Card.findOne({ phone_number: phoneNumber });
    } else {
      result = await Card.findOne({ card_id: cardId });
    }

    if (!result) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ status: result.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
