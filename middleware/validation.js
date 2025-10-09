const Joi = require('joi');

const puzzleSchema = Joi.object({
  clues: Joi.array().items(
    Joi.array().items(Joi.number().integer().min(1).max(9)).length(4)
  ).length(4).required(),
  solution: Joi.array().items(Joi.number().integer().min(1).max(9)).length(4).required()
    .custom((value, helpers) => {
      if (new Set(value).size !== 4) {
        return helpers.error('any.custom', { message: 'Solution must have unique digits' });
      }
      return value;
    }),
  picas: Joi.array().items(Joi.number().integer().min(0).max(4)).length(4).required(),
  centro: Joi.array().items(Joi.number().integer().min(0).max(4)).length(4).required(),
  hint: Joi.array().items(Joi.number().integer()).length(2).required()
    .custom((value, helpers) => {
      const [position, digit] = value;
      if (position < 1 || position > 9) {
        return helpers.error('any.custom', { message: 'Hint position must be between 1 and 9' });
      }
      if (digit < 1 || digit > 9) {
        return helpers.error('any.custom', { message: 'Hint digit must be between 1 and 9' });
      }
      if (position === digit) {
        return helpers.error('any.custom', { message: 'Both hints cannot be the same' });
      }
      return value;
    }),
  date: Joi.string().isoDate().optional()
    .custom((value, helpers) => {
      if (value) {
        const puzzleDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        
        if (puzzleDate < today) {
          return helpers.error('any.custom', { 
            message: `Cannot create puzzle for past date: ${value}. Today is ${today.toISOString().split('T')[0]}` 
          });
        }
      }
      return value;
    }),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  is_active: Joi.boolean().optional()
}).custom((value, helpers) => {
  // Validate puzzle logic consistency
  const { clues, solution, picas, centro, hint } = value;

  // Ensure all solution digits appear in the clues at least once
  const clueDigits = new Set(clues.flat());
  const missing = solution.filter(d => !clueDigits.has(d));
  if (missing.length > 0) {
    return helpers.error('any.custom', {
      message: `Solution contains digits not present in clues: ${missing.join(', ')}`
    });
  }

  // Ensure hint digit appears in the clues
  const hintDigit = hint[1]; // hint is [position, digit]
  if (!clueDigits.has(hintDigit)) {
    return helpers.error('any.custom', {
      message: `Hint digit ${hintDigit} is not present in any of the clues. Available digits: ${Array.from(clueDigits).sort().join(', ')}`
    });
  }

  // Ensure hint digit is not the same as the solution digit at that position
  const hintPosition = hint[0] - 1; // Convert to 0-based index
  if (solution[hintPosition] === hintDigit) {
    return helpers.error('any.custom', {
      message: `Hint cannot be the same as the solution: digit ${hintDigit} at position ${hint[0]} matches the solution`
    });
  }
  
  for (let i = 0; i < 4; i++) {
    const clue = clues[i];
    let expectedPicas = 0;
    let expectedCentros = 0;
    
    // Check for centros (correct position)
    for (let j = 0; j < 4; j++) {
      if (clue[j] === solution[j]) {
        expectedCentros++;
      }
    }
    
    // Check for picas (correct digit, wrong position)
    const solutionCopy = [...solution];
    const clueCopy = [...clue];
    
    // Remove exact matches first
    for (let j = 0; j < 4; j++) {
      if (clueCopy[j] === solutionCopy[j]) {
        clueCopy[j] = -1;
        solutionCopy[j] = -2;
      }
    }
    
    // Then check for picas
    for (let j = 0; j < 4; j++) {
      if (clueCopy[j] !== -1 && solutionCopy.includes(clueCopy[j])) {
        expectedPicas++;
        const idx = solutionCopy.indexOf(clueCopy[j]);
        solutionCopy[idx] = -2;
      }
    }
    
    if (expectedPicas !== picas[i] || expectedCentros !== centro[i]) {
      return helpers.error('any.custom', { 
        message: `Clue ${i+1} inconsistency: expected Picas=${expectedPicas}, Centros=${expectedCentros}, got Picas=${picas[i]}, Centros=${centro[i]}`
      });
    }
  }
  
  return value;
}).messages({
  'any.custom': '{{#message}}'
});

function validatePuzzle(puzzle) {
  return puzzleSchema.validate(puzzle);
}

const statSchema = Joi.object({
  puzzle_id: Joi.number().integer().min(1).required(),
  duration_in_seconds: Joi.number().integer().min(0).required(),
  // Keep old fields for backward compatibility
  puzzle_date: Joi.string().isoDate().optional(),
  user_id: Joi.string().optional(),
  solve_time: Joi.number().integer().min(0).optional(),
  completed: Joi.boolean().optional(),
  attempts: Joi.number().integer().min(1).optional()
});

function validateStat(stat) {
  return statSchema.validate(stat);
}

module.exports = {
  validatePuzzle,
  validateStat
};
