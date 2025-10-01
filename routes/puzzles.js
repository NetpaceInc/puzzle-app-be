const express = require('express');
const Puzzle = require('../models/Puzzle');
const { validatePuzzle } = require('../middleware/validation');

const router = express.Router();

// Get puzzles
// If ?date=YYYY-MM-DD is provided, return that puzzle only; otherwise paginated list
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (date) {
      const puzzle = await Puzzle.getByDateAnyStatus(date);
      if (!puzzle) {
        return res.status(404).json({ error: 'Puzzle not found for date' });
      }
      return res.json(puzzle);
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await Puzzle.getAll(page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's puzzle for mobile app
router.get('/today', async (req, res) => {
  try {
    const today = Puzzle.getTodayDate();
    const puzzle = await Puzzle.getByDate(today);
    
    if (!puzzle) {
      return res.status(404).json({ error: 'No puzzle available for today' });
    }
    
    // Format response for mobile app
    const { clues, solution, picas, centro, hint } = puzzle;
    res.json({
      clues,
      solution,
      picas,
      centro,
      hint
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get puzzle by ID
router.get('/:id', async (req, res) => {
  try {
    const puzzle = await Puzzle.getById(req.params.id);
    if (!puzzle) {
      return res.status(404).json({ error: 'Puzzle not found' });
    }
    res.json(puzzle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new puzzle
router.post('/', async (req, res) => {
  try {
    const result = await Puzzle.create(req.body);
    res.status(201).json({
      message: 'Puzzle created successfully',
      puzzle_id: result.id,
      date: result.date
    });
  } catch (error) {
    if (error.message.includes('Validation failed') || error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update puzzle
router.put('/:id', async (req, res) => {
  try {
    const puzzle = await Puzzle.update(req.params.id, req.body);
    res.json({
      message: 'Puzzle updated successfully',
      puzzle
    });
  } catch (error) {
    if (error.message.includes('Validation failed') || error.message.includes('not found')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete puzzle
router.delete('/:id', async (req, res) => {
  try {
    const result = await Puzzle.delete(req.params.id);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
