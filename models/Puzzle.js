const database = require('../config/database');
const { validatePuzzle } = require('../middleware/validation');

class Puzzle {
  static async create(puzzleData) {
    const { error } = validatePuzzle(puzzleData);
    if (error) {
      const detail = error.details && error.details[0];
      const message = detail && detail.message ? detail.message : error.message;
      throw new Error(`Validation failed: ${message}`);
    }

    // Check if puzzle for date already exists (any status)
    const existing = await database.get(
      'SELECT id FROM puzzles WHERE date = $1',
      [puzzleData.date || this.getTomorrowDate()]
    );

    if (existing) {
      throw new Error('Puzzle for this date already exists');
    }

    const date = puzzleData.date || this.getTomorrowDate();
    const result = await database.run(
      `INSERT INTO puzzles (date, clues, solution, picas, centros, hint, difficulty) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        date,
        JSON.stringify(puzzleData.clues),
        puzzleData.solution.join(','),
        puzzleData.picas.join(','),
        puzzleData.centro.join(','),
        puzzleData.hint.join(','),
        puzzleData.difficulty || 'medium'
      ]
    );

    return { id: result.id, date };
  }

  static async getById(id) {
    const puzzle = await database.get('SELECT * FROM puzzles WHERE id = $1', [id]);
    if (!puzzle) return null;

    return this.formatPuzzle(puzzle);
  }


  static async getAllWithCount(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const puzzles = await database.all(
      'SELECT * FROM puzzles ORDER BY date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const totalResult = await database.get('SELECT COUNT(*) as count FROM puzzles');
    const total = Number(totalResult.count);

    return {
      rows: puzzles.map(this.formatPuzzle),
      count: total,
    };
  }
  
  static async getByDate(date) {
    const puzzle = await database.get(
      'SELECT * FROM puzzles WHERE date = $1 AND is_active = TRUE',
      [date]
    );
    if (!puzzle) return null;

    return this.formatPuzzle(puzzle);
  }

  static async getByDateAnyStatus(date) {
    const puzzle = await database.get(
      'SELECT * FROM puzzles WHERE date = $1',
      [date]
    );
    if (!puzzle) return null;
    return this.formatPuzzle(puzzle);
  }

  static async getAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const puzzles = await database.all(
      'SELECT * FROM puzzles ORDER BY date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const totalResult = await database.get('SELECT COUNT(*) as count FROM puzzles');
    const total = Number(totalResult.count);

    return {
      puzzles: puzzles.map(this.formatPuzzle),
      total,
      pages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  static async update(id, updates) {
    const puzzle = await this.getById(id);
    if (!puzzle) {
      throw new Error('Puzzle not found');
    }

    // Merge updates with existing data for validation
    const updatedData = { ...puzzle, ...updates };
    const { error } = validatePuzzle(updatedData);
    if (error) {
      const detail = error.details && error.details[0];
      const message = detail && detail.message ? detail.message : error.message;
      throw new Error(`Validation failed: ${message}`);
    }

    const fields = [];
    const values = [];

    if (updates.clues) {
      values.push(JSON.stringify(updates.clues));
      fields.push(`clues = $${values.length}`);
    }
    if (updates.solution) {
      values.push(updates.solution.join(','));
      fields.push(`solution = $${values.length}`);
    }
    if (updates.picas) {
      values.push(updates.picas.join(','));
      fields.push(`picas = $${values.length}`);
    }
    if (updates.centro) {
      values.push(updates.centro.join(','));
      fields.push(`centros = $${values.length}`);
    }
    if (updates.hint) {
      values.push(updates.hint.join(','));
      fields.push(`hint = $${values.length}`);
    }
    if (updates.difficulty) {
      values.push(updates.difficulty);
      fields.push(`difficulty = $${values.length}`);
    }
    if (updates.is_active !== undefined) {
      values.push(updates.is_active === true);
      fields.push(`is_active = $${values.length}`);
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    await database.run(
      `UPDATE puzzles SET ${fields.join(', ')} WHERE id = $${values.length}`,
      values
    );

    return this.getById(id);
  }

  static async delete(id) {
    const result = await database.run('DELETE FROM puzzles WHERE id = $1', [id]);
    if (result.changes === 0) {
      throw new Error('Puzzle not found');
    }
    return { message: 'Puzzle deleted successfully' };
  }

  static formatPuzzle(dbPuzzle) {
    return {
      id: dbPuzzle.id,
      date: dbPuzzle.date,
      clues: JSON.parse(dbPuzzle.clues),
      solution: dbPuzzle.solution.split(',').map(Number),
      picas: dbPuzzle.picas.split(',').map(Number),
      centro: dbPuzzle.centros.split(',').map(Number),
      hint: dbPuzzle.hint.split(',').map(Number),
      difficulty: dbPuzzle.difficulty,
      is_active: Boolean(dbPuzzle.is_active),
      created_at: dbPuzzle.created_at
    };
  }

  static getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  static getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }
}

module.exports = Puzzle;
