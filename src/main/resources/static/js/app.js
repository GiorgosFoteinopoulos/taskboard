const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

const statusLabel = document.getElementById('server-status');
const checkButton = document.getElementById('check-button');
const boardMessage = document.getElementById('board-message');
const boardMessageText = document.getElementById('board-message-text');
const boardMessageClose = document.getElementById('board-message-close');
const board = document.querySelector('.board');
const columns = document.querySelectorAll('.column');
const taskForm = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const addButton = taskForm.querySelector('button[type="submit"]');
const formError = document.getElementById('form-error');


class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

async function request(method, path, body) {
    const options = { method: method, headers: {} };
    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(path, options);
    } catch (networkError) {
        throw new ApiError(0, 'Cannot reach the server. Is the app running?');
    }

    if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        throw new ApiError(response.status, problem.message || 'HTTP ' + response.status);
    }

    if (response.status === 204) {
        return null;
    }
    return response.json();
}


async function checkServer() {
    statusLabel.textContent = 'Checking the server...';
    statusLabel.className = 'status';

    try {
        const data = await request('GET', '/api/ping');
        statusLabel.textContent = 'Server says "' + data.message + '" at ' + formatTime(data.serverTime);
        statusLabel.className = 'status ok';
    } catch (error) {
        statusLabel.textContent = error.message;
        statusLabel.className = 'status error';
    }
}


async function loadTasks() {
    try {
        const tasks = await request('GET', '/api/tasks');
        hideBoardMessage();
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
    card.draggable = true;

    const title = document.createElement('p');
    title.className = 'card-title';
    title.textContent = task.title;

    const meta = document.createElement('p');
    meta.className = 'card-meta';
    meta.textContent = '#' + task.id + ' · created ' + formatTime(task.createdAt);

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.append(createDeleteButton());
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

function createDeleteButton() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'delete';
    button.dataset.delete = 'true';
    button.textContent = '🗑';
    button.title = 'Delete task';
    return button;
}

function createEmptyMessage() {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No tasks yet';
    return empty;
}

function showBoardMessage(text) {
    boardMessageText.textContent = text;
    boardMessage.hidden = false;
}

function hideBoardMessage() {
    boardMessage.hidden = true;
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
        const created = await request('POST', '/api/tasks', { title: titleInput.value });
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
    const moveButton = event.target.closest('button[data-move]');
    if (moveButton) {
        const card = moveButton.closest('.card');
        await moveTask(card.dataset.id, moveButton.dataset.move);
        return;
    }

    const deleteButton = event.target.closest('button[data-delete]');
    if (deleteButton) {
        const card = deleteButton.closest('.card');
        const title = card.querySelector('.card-title').textContent;
        if (confirm('Delete "' + title + '"?')) {
            await deleteTask(card.dataset.id);
        }
    }
}

async function moveTask(id, status) {
    try {
        await request('PATCH', '/api/tasks/' + id, { status: status });
        await loadTasks();
        highlightCard(id);
    } catch (error) {
        await showCardError('Could not move the task', error);
    }
}

async function deleteTask(id) {
    try {
        await request('DELETE', '/api/tasks/' + id);
        await loadTasks();
    } catch (error) {
        await showCardError('Could not delete the task', error);
    }
}

async function showCardError(action, error) {
    if (error.status === 404) {
        await loadTasks();
        showBoardMessage(action + ': ' + error.message + '. The board was refreshed.');
    } else {
        showBoardMessage(action + ': ' + error.message);
    }
}

function handleDragStart(event) {
    const card = event.target.closest('.card');
    if (!card) {
        return;
    }
    event.dataTransfer.setData('text/plain', card.dataset.id);
    event.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
}

function handleDragEnd(event) {
    const card = event.target.closest('.card');
    if (card) {
        card.classList.remove('dragging');
    }
    for (const column of columns) {
        column.classList.remove('drop-target');
    }
}

function handleDragOver(event) {
    const column = event.target.closest('.column');
    if (!column) {
        return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    column.classList.add('drop-target');
}

function handleDragLeave(event) {
    const column = event.target.closest('.column');
    if (column && !column.contains(event.relatedTarget)) {
        column.classList.remove('drop-target');
    }
}

async function handleDrop(event) {
    const column = event.target.closest('.column');
    if (!column) {
        return;
    }
    event.preventDefault();
    column.classList.remove('drop-target');

    const id = event.dataTransfer.getData('text/plain');
    const card = document.querySelector('.card[data-id="' + id + '"]');
    const fromStatus = card ? card.closest('.column').dataset.status : null;
    const toStatus = column.dataset.status;

    if (fromStatus !== toStatus) {
        await moveTask(id, toStatus);
    }
}



checkButton.addEventListener('click', checkServer);
taskForm.addEventListener('submit', createTask);
board.addEventListener('click', handleBoardClick);
boardMessageClose.addEventListener('click', hideBoardMessage);
board.addEventListener('dragstart', handleDragStart);
board.addEventListener('dragend', handleDragEnd);
board.addEventListener('dragover', handleDragOver);
board.addEventListener('dragleave', handleDragLeave);
board.addEventListener('drop', handleDrop);
checkServer();
loadTasks();