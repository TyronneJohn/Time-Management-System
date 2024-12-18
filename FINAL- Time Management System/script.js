
        let taskCounter = 0;
        let editingIndex = null;
        let timers = {};
        let taskStartTime = {};
        let accumulatedTime = {};
        let isPaused = {};

        window.addEventListener('load', function () {
            const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const sortedTasks = sortTasksByPriority(storedTasks);

            storedTasks.forEach((task, index) => {
                accumulatedTime[index] = task.actualTime || 0;
            });

            sortedTasks.forEach((task, index) => displayTask(task, index));
            updateDailySummary();
            updateWeeklySummary();
        });

        function sortTasksByPriority(tasks) {
            const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
            return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        }
        

        document.getElementById('taskForm').addEventListener('submit', function (e) {
            e.preventDefault();
            if (editingIndex !== null) {
                saveTaskChanges();
            } else {
                addNewTask();
            }
        });

        document.getElementById('searchButton').addEventListener('click', function () {
            const keyword = document.getElementById('searchBar').value.trim().toLowerCase();
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const filteredTasks = tasks.filter(task =>
                task.title.toLowerCase().includes(keyword) ||
                task.description.toLowerCase().includes(keyword)
            );

            const sortedFilteredTasks = sortTasksByPriority(filteredTasks); 
            document.getElementById('tasks').innerHTML = '';
            taskCounter = 0;
            sortedFilteredTasks.forEach(displayTask);

            if (sortedFilteredTasks.length === 0) {
                const noResults = document.createElement('p');
                noResults.textContent = 'No tasks found matching the keyword.';
                document.getElementById('tasks').appendChild(noResults);
            }
        });


        function addNewTask() {
            const task = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                priority: document.getElementById('priority').value,
                estimatedTime: document.getElementById('time').value,
                day: document.getElementById('day').value,
                startTime: document.getElementById('startTime').value || 'Not Specified',
            };

            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            
            
            const conflictIndex = tasks.findIndex(existingTask => {
                return existingTask.day === task.day && existingTask.startTime === task.startTime;
            });

            if (conflictIndex !== -1) {
                alert('Conflict detected! The task will be rescheduled to the next available time slot.');
                
                let conflictTask = tasks[conflictIndex];
                let nextAvailableTime = getNextAvailableTime(task.day, task.startTime);
                task.startTime = nextAvailableTime;
            }

            tasks.push(task);
            localStorage.setItem('tasks', JSON.stringify(tasks));

            const sortedTasks = sortTasksByPriority(tasks);

            document.getElementById('tasks').innerHTML = '';
            taskCounter = 0;
            sortedTasks.forEach(displayTask);
            document.getElementById('taskForm').reset();
            updateDailySummary(); 
        }

        function getNextAvailableTime(day, startTime) {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let availableTime = startTime;

            while (tasks.some(task => task.day === day && task.startTime === availableTime)) {
                availableTime = incrementTimeBy15Minutes(availableTime);
            }

            return availableTime;
        }

        function incrementTimeBy15Minutes(time) {
            let [hours, minutes] = time.split(':').map(Number);
            minutes += 15;
            if (minutes >= 60) {
                minutes = 0;
                hours += 1;
            }
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }


        function displayTask(task, index) {
            const taskList = document.getElementById('tasks');
            if (taskCounter % 5 === 0 && taskCounter !== 0) {
                const hr = document.createElement('hr');
                hr.style.margin = '20px 0';
                taskList.appendChild(hr);
            }

            const taskItem = document.createElement('li');
            taskItem.setAttribute('data-index', index);
            taskItem.style.marginBottom = '10px';
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" data-index="${index}">
                <strong>Title:</strong> ${task.title}<br>
                <strong>Description:</strong> ${task.description}<br>
                <strong>Priority:</strong> ${task.priority}<br>
                <strong>Estimated Time:</strong> ${task.estimatedTime}<br>
                <strong>Day:</strong> ${task.day}<br>
                <strong>Start Time:</strong> ${task.startTime}<br>
                <span id="timeSpent${index}">0:00</span><br>
                <button class="start-timer" data-index="${index}">Start</button>
                <button class="pause-timer" data-index="${index}" disabled>Pause</button>
                <button class="stop-timer" data-index="${index}" disabled>Stop</button>
                <button class="edit-task" data-index="${index}">Edit</button>
                <button class="delete-task" data-index="${index}">Delete</button>
            `;

            taskList.appendChild(taskItem);
            taskCounter++;

    taskItem.querySelector('.delete-task').addEventListener('click', function () {
        const taskTitle = task.title; 
        deleteTask(taskTitle);
    });

            taskItem.querySelector('.start-timer').addEventListener('click', function () {
                startTimer(index);
            });
            taskItem.querySelector('.pause-timer').addEventListener('click', function () {
                pauseTimer(index);
            });
            taskItem.querySelector('.stop-timer').addEventListener('click', function () {
                stopTimer(index);
            });

            taskItem.querySelector('.delete-task').addEventListener('click', function () {
                deleteTask(index);
            });
        }

        document.getElementById('tasks').addEventListener('click', function (e) {
            if (e.target.classList.contains('edit-task')) {
                const index = parseInt(e.target.getAttribute('data-index'));
                const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
                const task = tasks[index];

                document.getElementById('title').value = task.title;
                document.getElementById('description').value = task.description;
                document.getElementById('priority').value = task.priority;
                document.getElementById('time').value = task.estimatedTime;
                document.getElementById('day').value = task.day;
                document.getElementById('startTime').value = task.startTime;

                editingIndex = index;
            }
        });

        function saveTaskChanges() {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const index = editingIndex;

            if (index !== null && tasks[index]) {
                const newTask = {
                    title: document.getElementById('title').value,
                    description: document.getElementById('description').value,
                    priority: document.getElementById('priority').value,
                    estimatedTime: document.getElementById('time').value,
                    day: document.getElementById('day').value,
                    startTime: document.getElementById('startTime').value || 'Not Specified',
        };

            const conflictIndex = tasks.findIndex((task, idx) => idx !== index && task.day === newTask.day && task.startTime === newTask.startTime);
            
                if (conflictIndex !== -1) {
                    alert('Conflict detected! The task will be rescheduled to the next available time slot.');
                    newTask.startTime = getNextAvailableTime(newTask.day, newTask.startTime);
                }

                tasks[index] = newTask;
                localStorage.setItem('tasks', JSON.stringify(tasks));

                const sortedTasks = sortTasksByPriority(tasks);

                document.getElementById('tasks').innerHTML = '';
                taskCounter = 0;
                tasks.forEach(displayTask);

                editingIndex = null;
                document.getElementById('taskForm').reset();
                updateDailySummary(); 
            }
        }

        function deleteTask(taskTitle) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const updatedTasks = tasks.filter(task => task.title !== taskTitle); 
    localStorage.setItem('tasks', JSON.stringify(updatedTasks)); 

    const sortedTasks = sortTasksByPriority(updatedTasks);

    document.getElementById('tasks').innerHTML = '';
    taskCounter = 0;
    sortedTasks.forEach(displayTask); 
    updateDailySummary(); 
}

        function startTimer(index) {
            if (isPaused[index]) {
                taskStartTime[index] = Date.now() - accumulatedTime[index];
            } else {
                taskStartTime[index] = Date.now(); 
            }

            timers[index] = setInterval(() => {
                const elapsed = Math.floor((Date.now() - taskStartTime[index]) / 1000);
                accumulatedTime[index] = elapsed; 
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById(`timeSpent${index}`).textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);

            isPaused[index] = false;
            document.querySelector(`.pause-timer[data-index="${index}"]`).disabled = false;
            document.querySelector(`.stop-timer[data-index="${index}"]`).disabled = false;
            document.querySelector(`.start-timer[data-index="${index}"]`).disabled = true;
        }

        function pauseTimer(index) {
            clearInterval(timers[index]);
            isPaused[index] = true;
            document.querySelector(`.start-timer[data-index="${index}"]`).disabled = false;
            document.querySelector(`.pause-timer[data-index="${index}"]`).disabled = true;
        }

        function stopTimer(index) {
            clearInterval(timers[index]);
            isPaused[index] = false;
            document.querySelector(`.start-timer[data-index="${index}"]`).disabled = false;
            document.querySelector(`.pause-timer[data-index="${index}"]`).disabled = true;
            document.querySelector(`.stop-timer[data-index="${index}"]`).disabled = true;

           
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            if (tasks[index]) {
                tasks[index].actualTime = accumulatedTime[index] || 0; 
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }

            updateDailySummary(); 
            updateWeeklySummary(); 
        }


        function updateDailySummary() {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const sortedTasks = sortTasksByPriority(tasks); 
            const summaryContent = document.getElementById('summaryContent');
            let totalEstimatedMinutes = 0;
            let totalActualSeconds = 0;

            let summaryHTML = `
                <table border="1" style="width:100%; color:white; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>Task Title</th>
                            <th>Estimated Time</th>
                            <th>Actual Time</th>
                        </tr>
                    </thead>
                    <tbody>`;

            tasks.forEach((task, index) => {
                const [estimatedHours, estimatedMinutes] = task.estimatedTime.split(':').map(Number);
                const estimatedTimeInMinutes = (estimatedHours * 60) + estimatedMinutes;
                totalEstimatedMinutes += estimatedTimeInMinutes;

                const actualTimeInSeconds = accumulatedTime[index] || 0;
                totalActualSeconds += actualTimeInSeconds;
                const actualMinutes = Math.floor(actualTimeInSeconds / 60);
                const actualSeconds = actualTimeInSeconds % 60;

                summaryHTML += `
                    <tr>
                        <td>${task.title}</td>
                        <td>${estimatedHours}h ${estimatedMinutes}m</td>
                        <td>${actualMinutes}m ${actualSeconds}s</td>
                    </tr>`;
            });

            const totalActualMinutes = Math.floor(totalActualSeconds / 60);
            const totalActualSecondsRemainder = totalActualSeconds % 60;

            summaryHTML += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total</th>
                            <th>${Math.floor(totalEstimatedMinutes / 60)}h ${totalEstimatedMinutes % 60}m</th>
                            <th>${totalActualMinutes}m ${totalActualSecondsRemainder}s</th>
                        </tr>
                    </tfoot>
                </table>`;

            summaryContent.innerHTML = tasks.length > 0 ? summaryHTML : '<p>No tasks added yet.</p>';
        }

        function updateWeeklySummary() {
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const sortedTasks = sortTasksByPriority(tasks); 

            const weeklyContent = document.getElementById('weeklyContent');
            let totalEstimatedMinutes = 0;
            let totalActualSeconds = 0;

            let summaryHTML = `
                <table border="1" style="width:100%; color:white; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th>Task Title</th>
                            <th>Estimated Time</th>
                            <th>Actual Time</th>
                        </tr>
                    </thead>
                    <tbody>`;

            tasks.forEach((task, index) => {
                const [estimatedHours, estimatedMinutes] = task.estimatedTime.split(':').map(Number);
                const estimatedTimeInMinutes = (estimatedHours * 60) + estimatedMinutes;
                totalEstimatedMinutes += estimatedTimeInMinutes;

                const actualTimeInSeconds = accumulatedTime[index] || 0;
                totalActualSeconds += actualTimeInSeconds;
                const actualMinutes = Math.floor(actualTimeInSeconds / 60);
                const actualSeconds = actualTimeInSeconds % 60;

                summaryHTML += `
                    <tr>
                        <td>${task.title}</td>
                        <td>${estimatedHours}h ${estimatedMinutes}m</td>
                        <td>${actualMinutes}m ${actualSeconds}s</td>
                    </tr>`;
            });

            const totalActualMinutes = Math.floor(totalActualSeconds / 60);
            const totalActualSecondsRemainder = totalActualSeconds % 60;

            summaryHTML += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Total</th>
                            <th>${Math.floor(totalEstimatedMinutes / 60)}h ${totalEstimatedMinutes % 60}m</th>
                            <th>${totalActualMinutes}m ${totalActualSecondsRemainder}s</th>
                        </tr>
                    </tfoot>
                </table>`;

            weeklyContent.innerHTML = tasks.length > 0 ? summaryHTML : '<p>No tasks added yet.</p>';
        }
        function updateWeeklySummaryOnChanges() {
            updateWeeklySummary();
        }
            window.addEventListener('load', function () {
                updateWeeklySummary(); 
            });