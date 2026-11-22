const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

const statusLabel = document.getElementById('server-status');
const checkButton = document.getElementById('check-button');
const boardMessage = document.getElementById('board-message');
const board = document.querySelector('.board');
const columns = document.querySelectorAll('.column');
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const addButton = taskForm.querySelector('button[type="submit"]');
const formError = document.getElementById('form-error');



async function checkServer() {
    statusLabel.textContent = 'Checking the server...';
    statusLabel.className = 'status';

    try {
        const response = await fetch('/api/ping');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const data = await response.json();
        statusLabel.textContent = 'Server says "' + data.message + '" at ' + formatTime(data.serverTime);
        statusLabel.className = 'status ok';
    } catch (error) {
        statusLabel.textContent = 'Cannot reach the server: ' + error.message;
        statusLabel.className = 'status error';
    }
}



async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const tasks = await response.json();
        boardMessage.hidden = true;
        renderBoard(tasks);
    } catch (error) {
        showBoardMessage('Could not load the tasks: ' + error.message);
    }
}

function renderBoard(tasks) {
    for (const column of columns) {
        const status = column.dataset.status;
        const columnTasks = tasks.filter(task => task.status === status);

        const cards = column.querySelector('.cards');
        cards.replaceChildren();
        for (const task of columnTasks) {
            cards.append(createCard(task));
        }
        if (columnTasks.length === 0) {
            cards.append(createEmptyMessage());
        }

        column.querySelector('.count').textContent = columnTasks.length;
    }
}

function createCard(task) {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = task.id;

    const title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = task.title;

    const meta = document.createElement('p');
    meta.className = 'card-meta';
    meta.textContent = '#' + task.id + ' · created ' + formatTime(task.createdAt);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const index = STATUSES.indexOf(task.status);
    if (index > 0) {
        actions.append(createMoveButton('←', STATUSES[index - 1]));
    }
    if (index < STATUSES.length - 1) {
        actions.append(createMoveButton('→', STATUSES[index + 1]));
    }

    card.append(title, meta, actions);
    return card;
}

function createMoveButton(arrow, targetStatus) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'move';
    button.dataset.move = targetStatus;
    button.textContent = arrow;
    button.title = 'Move to ' + LABELS[targetStatus];
    return button;
}

function createEmptyMessage() {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No tasks yet';
    return empty;
}

function showBoardMessage(text) {
    boardMessage.textContent = text;
    boardMessage.hidden = false;
}

function formatTime(isoText) {
    return new Date(isoText).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function createTask(event) {
    event.preventDefault();
    formError.hidden = true;
    addButton.disabled = true;

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: titleInput.value})
        });
        if (!response.ok) {
            const problem = await response.json().catch(() => ({}));
            throw new Error(problem.message || 'HTTP ' + response.status);
        }
        const created = await response.json();

        taskForm.reset();
        titleInput.focus();
        await loadTasks();
        highlightCard(created.id);
    } catch (error) {
        formError.textContent = error.message;
        formError.hidden = false;
    } finally {
        addButton.disabled = false;
    }
}

function highlightCard(id) {
    const card = document.querySelector('.card[data-id="' + id + '"]');
    if (card) {
        card.classList.add('new');
    }
}

async function handleBoardClick(event) {
    const button = event.target.closest('button[data-move]');
    if (!button) {
        return;
    }
    const card = button.closest('.card');
    await moveTask(card.dataset.id, button.dataset.move);
}

async function moveTask(id, status) {
    try {
        const response = await fetch('/api/tasks/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        if (!response.ok) {
            const problem = await response.json().catch(() => ({}));
            throw new Error(problem.message || 'HTTP ' + response.status);
        }
        await loadTasks();
        highlightCard(id);
    } catch (error) {
        showBoardMessage('Could not move the task: ' + error.message);
    }
}



checkButton.addEventListener('click', checkServer);
taskForm.addEventListener('submit', createTask);
board.addEventListener('click', handleBoardClick);
checkServer();
loadTasks();