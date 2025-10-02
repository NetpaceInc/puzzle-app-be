const database = require('../config/database');

class GameStat {
  static async create(statData) {
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

  static async getStats() {
    const today = new Date().toISOString().split('T')[0];

    // Today's stats
    const todayStats = await database.get(`
      SELECT 
        COUNT(*)::int as players,
        AVG(solve_time) as avg_solve_time,
        AVG(attempts) as avg_attempts
      FROM game_stats 
      WHERE puzzle_date = $1 AND completed = TRUE
    `, [today]);

    // Overall stats
    const overallStats = await database.get(`
      SELECT 
        COUNT(*)::int as puzzles
      FROM puzzles 
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
        players: todayStats.players || 0,
        avg_solve_time: Math.round((todayStats.avg_solve_time || 0) * 100) / 100,
        avg_attempts: Math.round((todayStats.avg_attempts || 0) * 100) / 100
      },
      overall: {
        puzzles: overallStats.puzzles || 0,
        avg_solve_time: Math.round((overallStats.avg_solve_time || 0) * 100) / 100,
        avg_attempts: Math.round((overallStats.avg_attempts || 0) * 100) / 100
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
