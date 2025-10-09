const database = require('../config/database');

class GameStat {
  static async create(statData) {
    // Handle new payload format with puzzle_id and duration_in_seconds
    if (statData.puzzle_id && statData.duration_in_seconds !== undefined) {
      // Get puzzle date from puzzle_id
      const puzzle = await database.get('SELECT date FROM puzzles WHERE id = $1', [statData.puzzle_id]);
      if (!puzzle) {
        throw new Error('Puzzle not found');
      }

      const result = await database.run(
        `INSERT INTO game_stats (puzzle_id, puzzle_date, duration_in_seconds, user_id, completed, attempts)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          statData.puzzle_id,
          puzzle.date,
          statData.duration_in_seconds,
          statData.user_id || 'mobile_user',
          statData.completed !== false, // Default to true for new format
          statData.attempts || 1
        ]
      );

      return { id: result.id };
    } else {
      // Handle old payload format for backward compatibility
      const result = await database.run(
        `INSERT INTO game_stats (puzzle_date, user_id, solve_time, completed, attempts)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          statData.puzzle_date,
          statData.user_id,
          statData.solve_time || null,
          statData.completed === true,
          statData.attempts || 1
        ]
      );

      return { id: result.id };
    }
  }

  static async getStats() {
    const today = new Date().toISOString().split('T')[0];

    // Today's stats
    const todayStats = await database.get(`
      SELECT 
        COUNT(*)::int as players,
        AVG(solve_time) as avg_solve_time,
        AVG(duration_in_seconds) as avg_duration_seconds,
        AVG(attempts) as avg_attempts
      FROM game_stats 
      WHERE puzzle_date = $1 AND completed = TRUE
    `, [today]);

    // Overall solutions count
    const overallSolutionsStats = await database.get(`
      SELECT 
        COUNT(*)::int as total_solutions
      FROM game_stats 
      WHERE completed = TRUE
    `);

    // Overall stats - total puzzles count
    const overallStats = await database.get(`
      SELECT 
        COUNT(*)::int as puzzles
      FROM puzzles 
    `);

    // Overall solve time stats
    const overallSolveTimeStats = await database.get(`
      SELECT 
        AVG(solve_time) as avg_solve_time_overall
      FROM game_stats 
      WHERE completed = TRUE AND solve_time IS NOT NULL
    `);

    // Recent puzzle completion rates
    const puzzleStats = await database.all(`
      SELECT 
        puzzle_date,
        COUNT(*)::int as total_attempts,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END)::int as completions
      FROM game_stats 
      GROUP BY puzzle_date 
      ORDER BY puzzle_date DESC 
      LIMIT 30
    `);

    return {
      today: {
        overall_solutions: overallSolutionsStats.total_solutions || 0,
        avg_solve_time_today: Math.round((todayStats.avg_solve_time || 0) * 100) / 100,
        avg_duration_seconds: Math.round((todayStats.avg_duration_seconds || 0) * 100) / 100,
        avg_attempts: Math.round((todayStats.avg_attempts || 0) * 100) / 100
      },
      overall: {
        puzzles: overallStats.puzzles || 0,
        avg_solve_time_overall: Math.round((overallSolveTimeStats.avg_solve_time_overall || 0) * 100) / 100
      },
      recent_puzzles: puzzleStats.map(stat => ({
        date: stat.puzzle_date,
        completion_rate: stat.total_attempts > 0 
          ? Math.round((stat.completions / stat.total_attempts) * 10000) / 100
          : 0
      }))
    };
  }
}

module.exports = GameStat;
