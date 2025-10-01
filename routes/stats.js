const express = require('express');
const GameStat = require('../models/GameStat');
const { validateStat } = require('../middleware/validation');

const router = express.Router();

// Get game statistics
router.get('/', async (req, res) => {
  try {
    const stats = await GameStat.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record game statistics from mobile app
router.post('/', async (req, res) => {
  try {
    const { error } = validateStat(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await GameStat.create(req.body);
    res.json({ message: 'Stat recorded successfully', id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
