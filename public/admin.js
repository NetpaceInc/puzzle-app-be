// Admin Panel Logic (migrated from inline script)
let authToken = null;
let currentPage = 1;
let pageLimit = 10;

function initializeClues() {
    const container = document.getElementById('cluesContainer');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 4; i++) {
        const clueDiv = document.createElement('div');
        clueDiv.className = 'clue-row';
        clueDiv.innerHTML = `
            <div class="clue-label" style="font-weight: bold; display: flex; align-items: center;">
                Clue ${String.fromCharCode(65 + i)}:
            </div>
            ${Array.from({length: 4}, (_, j) => 
                `<input type="number" min="1" max="9" class="clue-input" 
                        data-clue="${i}" data-pos="${j}" placeholder="${j + 1}" required>`
            ).join('')}
        `;
        container.appendChild(clueDiv);
    }

    // Enforce 1-9 single-digit for all clue inputs
    container.querySelectorAll('.clue-input').forEach((input) => {
        input.setAttribute('inputmode', 'numeric');
        input.addEventListener('input', () => {
            // Keep only digits, clamp to 1..9, enforce single digit
            const digit = (input.value || '').replace(/\D+/g, '').slice(0, 1);
            if (digit === '') {
                input.value = '';
                return;
            }
            let num = parseInt(digit, 10);
            if (isNaN(num) || num < 1) num = 1;
            if (num > 9) num = 9;
            input.value = String(num);
        });
    });
}

function initializeSolutionPicasCentros() {
    // Solution inputs (1-9)
    const solutionContainer = document.getElementById('solutionContainer');
    if (solutionContainer) {
        solutionContainer.innerHTML = '';
        for (let j = 0; j < 4; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '1';
            input.max = '9';
            input.className = 'clue-input';
            input.placeholder = String(j + 1);
            input.addEventListener('input', () => {
                const digit = (input.value || '').replace(/\D+/g, '').slice(0, 1);
                let num = parseInt(digit || '');
                if (isNaN(num)) { input.value = ''; return; }
                if (num < 1) num = 1;
                if (num > 9) num = 9;
                input.value = String(num);
            });
            solutionContainer.appendChild(input);
        }
    }

    // Picas (0-4)
    const picasContainer = document.getElementById('picasContainer');
    if (picasContainer) {
        picasContainer.innerHTML = '';
        for (let j = 0; j < 4; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '4';
            input.className = 'clue-input';
            input.placeholder = String(j + 1);
            input.addEventListener('input', () => {
                const digit = (input.value || '').replace(/\D+/g, '').slice(0, 1);
                let num = parseInt(digit || '');
                if (isNaN(num)) { input.value = ''; return; }
                if (num < 0) num = 0;
                if (num > 4) num = 4;
                input.value = String(num);
            });
            picasContainer.appendChild(input);
        }
    }

    // Centros (0-4)
    const centrosContainer = document.getElementById('centrosContainer');
    if (centrosContainer) {
        centrosContainer.innerHTML = '';
        for (let j = 0; j < 4; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '4';
            input.className = 'clue-input';
            input.placeholder = String(j + 1);
            input.addEventListener('input', () => {
                const digit = (input.value || '').replace(/\D+/g, '').slice(0, 1);
                let num = parseInt(digit || '');
                if (isNaN(num)) { input.value = ''; return; }
                if (num < 0) num = 0;
                if (num > 4) num = 4;
                input.value = String(num);
            });
            centrosContainer.appendChild(input);
        }
    }

    const hintContainer = document.getElementById('hintContainer');
    if (hintContainer) {
        hintContainer.innerHTML = '';
        for (let j = 0; j < 2; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = '9';
            input.className = 'clue-input';
            input.placeholder = String(j + 1);
            input.addEventListener('input', () => {
                const digit = (input.value || '').replace(/\D+/g, '').slice(0, 1);
                let num = parseInt(digit || '');
                if (isNaN(num)) { input.value = ''; return; }
                if (num < 0) num = 0;
                if (num > 4) num = 4;
                input.value = String(num);
            });
            hintContainer.appendChild(input);
        }
    }
}

function getFormData() {
    const clues = [];
    for (let i = 0; i < 4; i++) {
        const clue = [];
        for (let j = 0; j < 4; j++) {
            const input = document.querySelector(`[data-clue="${i}"][data-pos="${j}"]`);
            clue.push(parseInt(input.value));
        }
        clues.push(clue);
    }

    const solution = Array.from(document.querySelectorAll('#solutionContainer .clue-input'))
        .map(el => parseInt(el.value));
    const picas = Array.from(document.querySelectorAll('#picasContainer .clue-input'))
        .map(el => parseInt(el.value));
    const centro = Array.from(document.querySelectorAll('#centrosContainer .clue-input'))
        .map(el => parseInt(el.value));
    const hints = Array.from(document.querySelectorAll('#hintContainer .clue-input'))
        .map(el => parseInt(el.value));

    return {
        date: document.getElementById('puzzleDate').value,
        clues,
        solution,
        picas,
        centro,
        hint: hints
    };
}

function showMessage(message, type = 'success') {
    const messageDiv = document.getElementById('formMessage');
    if (!messageDiv) return;
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

async function loadStats() {
    try {
        const response = await apiFetch('/api/stats');
        const stats = await response.json();

        const statsGrid = document.getElementById('statsGrid');
        if (!statsGrid) return;
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.today.players}</div>
                <div class="stat-label">Today's Players</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.today.avg_solve_time}s</div>
                <div class="stat-label">Avg Solve Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.overall.puzzles}</div>
                <div class="stat-label">Total Puzzles</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.overall.avg_attempts}</div>
                <div class="stat-label">Avg Attempts</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function buildPuzzleRowActions(id) {
    return `
        <div class="actions">
           
            <button class="btn btn-sm btn-danger" data-action="delete" data-id="${id}">🗑️ Delete</button>
        </div>
    `;
}

async function fetchToken() {
    try {
      const response = await fetch('/api/token');
      const data = await response.json();
      authToken = data.token;
      console.log('Token acquired:', authToken);
    } catch (err) {
      console.error('Error fetching token:', err);
    }
  }

  async function apiFetch(url, options = {}) {
    if (!authToken) {
      await fetchToken(); // get token first if missing
    }
  
    // Don’t attach token if it’s the token endpoint
    if (!url.includes('/api/token')) {
      options.headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${authToken}`
      };
    }
  
  const separator = url.includes('?') ? '&' : '?';
  const urlWithToken = `${url}${separator}token=${authToken}`;

  return fetch(urlWithToken, options);
  }

  function isToday(dateStr) {
    const puzzleDate = new Date(dateStr);
    const today = new Date();
  
    return (
      puzzleDate.getFullYear() === today.getFullYear() &&
      puzzleDate.getMonth() === today.getMonth() &&
      puzzleDate.getDate() === today.getDate()
    );
  }
  

async function loadPuzzles(page = 1) {
    try {
        const response = await apiFetch(`/api/puzzles?page=${page}&limit=${pageLimit}`);
        const data = await response.json();

        const puzzles = data.data;
        const pagination = data;

        const puzzlesList = document.getElementById('puzzlesList');
        if (!puzzlesList) return;

        puzzlesList.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${puzzles.map(puzzle => `
                        <tr>
                            <td>${puzzle.id}</td>
                            <td>${new Date(puzzle.date).toLocaleDateString()}</td>
                            <td>${isToday(puzzle.date) ? '🟢 Active' : '🔴 Inactive'}</td>
                            <td>${new Date(puzzle.created_at).toLocaleDateString()}</td>
                            <td class="actions">${buildPuzzleRowActions(puzzle.id)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div id="paginationControls" class="pagination">
                <button class='btn btn-sm' ${pagination.page === 1 ? 'disabled' : ''} data-page="${pagination.page - 1}">Prev</button>
                <span>Page ${pagination.page} of ${pagination.totalPages}</span>
                <button class='btn btn-sm' ${pagination.page === pagination.totalPages ? 'disabled' : ''} data-page="${pagination.page + 1}">Next</button>
            </div>
        `;

        // Delegate table actions
        puzzlesList.querySelector('tbody').addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const action = target.getAttribute('data-action');
            const id = target.getAttribute('data-id');
            if (action === 'delete') {
                await deletePuzzle(id);
                loadPuzzles(currentPage); // reload after delete
            } else if (action === 'edit') {
                await editPuzzle(id);
            }
        });

        // Delegate pagination actions
        document.getElementById('paginationControls').addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-page]');
            if (!btn) return;
            currentPage = parseInt(btn.getAttribute('data-page'));
            loadPuzzles(currentPage);
        });

    } catch (error) {
        console.error('Error loading puzzles:', error);
    }
}

async function deletePuzzle(id) {
    if (!confirm('Delete this puzzle?')) return;
    try {
        const res = await apiFetch(`/api/puzzles/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        await loadPuzzles();
        await loadStats();
        showMessage('Puzzle deleted');
    } catch (e) {
        showMessage('Error deleting puzzle: ' + e.message, 'error');
    }
}

async function editPuzzle(id) {
    try {
        const res = await fetch(`/api/puzzles/${id}`);
        if (!res.ok) throw new Error('Unable to fetch puzzle');
        const puzzle = await res.json();

        // Populate form for editing
        document.getElementById('puzzleDate').value = puzzle.date;
        const inputs = document.querySelectorAll('.clue-input');
        let k = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                inputs[k++].value = puzzle.clues[i][j];
            }
        }
        const solInputs = document.querySelectorAll('#solutionContainer .clue-input');
        puzzle.solution.forEach((v, i) => { solInputs[i].value = v; });
        const picasInputs = document.querySelectorAll('#picasContainer .clue-input');
        puzzle.picas.forEach((v, i) => { picasInputs[i].value = v; });
        const centroInputs = document.querySelectorAll('#centrosContainer .clue-input');
        puzzle.centro.forEach((v, i) => { centroInputs[i].value = v; });
        document.getElementById('hint').value = puzzle.hint.join(',');
        document.getElementById('difficulty').value = puzzle.difficulty;

        // Stash editing id on form dataset
        const form = document.getElementById('puzzleForm');
        form.dataset.editId = id;
        showMessage('Loaded puzzle into form. Submitting will update it.');
    } catch (e) {
        showMessage('Error loading puzzle: ' + e.message, 'error');
    }
}

function setupFormHandlers() {
    const form = document.getElementById('puzzleForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const puzzleData = getFormData();
            const isEditing = Boolean(form.dataset.editId);
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `/api/puzzles/${form.dataset.editId}` : '/api/puzzles';

            const response = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(puzzleData)
            });

            const result = await response.json();
            if (response.ok) {
                showMessage(isEditing ? 'Puzzle updated successfully!' : 'Puzzle created successfully!');
                form.reset();
                delete form.dataset.editId;
                initializeClues();
                loadStats();
                loadPuzzles();
            } else {
                showMessage(result.error || 'Request failed', 'error');
            }
        } catch (error) {
            showMessage('Error saving puzzle: ' + error.message, 'error');
        }
    });
}

function setupButtons() {
    const refreshStatsBtn = document.querySelector('button[data-role="refresh-stats"]');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', () => loadStats());
    }

    const refreshListBtn = document.querySelector('button[data-role="refresh-list"]');
    if (refreshListBtn) {
        refreshListBtn.addEventListener('click', () => loadPuzzles());
    }
}

function setDefaultDateToTomorrow() {
    const dateInput = document.getElementById('puzzleDate');
    if (!dateInput) return;
    // Prevent selecting previous days
    const today = new Date();
    dateInput.min = today.toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
}

function setupTextInputConstraints() {
    const picas = document.getElementById('picas');
    const centros = document.getElementById('centros');
    const hint = document.getElementById('hint');

    // Exactly 4 digits (0-9) separated by 3 commas
    const fourDigitsPattern = /^\s*([1-9])\s*,\s*([1-9])\s*,\s*([1-9])\s*,\s*([1-9])\s*$/;
    // Exactly 2 digits (1-9) separated by 1 comma (matches backend constraints 1..9)
    const twoDigits19Pattern = /^\s*([1-9])\s*,\s*([1-9])\s*$/;

    const attachMask = (el, pattern, title) => {
        if (!el) return;
        el.setAttribute('pattern', pattern.source);
        el.setAttribute('title', title);
        el.addEventListener('input', () => {
            // Remove all except digits and commas; collapse multiple commas/spaces
            let v = el.value.replace(/[^0-9,]/g, '');
            // Prevent multiple commas in a row
            v = v.replace(/,+/g, (m) => (m.length > 1 ? ',' : m));
            // Trim leading/trailing commas
            v = v.replace(/^,|,$/g, '');
            el.value = v;
        });
    };

    attachMask(picas, fourDigitsPattern, 'Format: d,d,d,d (each 0-9, 4 numbers)');
    attachMask(centros, fourDigitsPattern, 'Format: d,d,d,d (each 0-9, 4 numbers)');
    attachMask(hint, twoDigits19Pattern, 'Format: p,d (position 1-4, digit 1-9)');
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    initializeClues();
    initializeSolutionPicasCentros();
    setupFormHandlers();
    setupButtons();
    setDefaultDateToTomorrow();
    loadStats();
    loadPuzzles();
});


