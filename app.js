// Interview Question Bank Application
class QuestionBank {
    constructor() {
        this.questions = [];
        this.codeSnippets = [];
        this.currentEditId = null;
        this.currentCodeEditId = null;
        this.currentSort = { field: 'dateSolved', direction: 'desc' };
        this.charts = {};
        this.lastSync = new Date();
        this.syncInterval = null;
    }

    async init() {
        await this.loadData();
        await this.loadCodeSnippets();
        this.setupEventListeners();
        this.populateDropdowns();
        this.updateDashboard();
        this.updateQuestionsTable();
        this.updateStatistics();
        this.updateCodeArchive();
        this.startAutoSync();
        this.updateSyncStatus('🟢', `Last sync: ${this.formatSyncTime(new Date())}`);
    }

    // Auto-sync functionality
    startAutoSync() {
        // Sync every 30 seconds when the page is visible
        this.syncInterval = setInterval(() => {
            if (!document.hidden && navigator.onLine) {
                this.syncData();
            }
        }, 30000);

        // Also sync when the page becomes visible again
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && navigator.onLine) {
                this.syncData();
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.updateSyncStatus('🟡', 'Back online, syncing...');
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.updateSyncStatus('🔴', 'Offline');
        });

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
            }
        });
    }

    async syncData() {
        try {
            this.updateSyncStatus('🟡', 'Syncing...');

            const response = await fetch('/api/questions');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const serverQuestions = await response.json();

            // Check if data has changed
            if (JSON.stringify(serverQuestions) !== JSON.stringify(this.questions)) {
                console.log('Data updated from server');
                const oldCount = this.questions.length;
                const newCount = serverQuestions.length;

                this.questions = serverQuestions;
                this.updateAll();
                this.lastSync = new Date();
                this.updateSyncStatus('🟢', `Last sync: ${this.formatSyncTime(this.lastSync)}`);

                // Show notification if questions were added/removed
                if (newCount !== oldCount) {
                    this.showNotification(`🔄 Data synced: ${newCount - oldCount > 0 ? '+' : ''}${newCount - oldCount} questions`);
                }
            } else {
                this.updateSyncStatus('🟢', `Up to date (${this.formatSyncTime(new Date())})`);
            }
        } catch (error) {
            console.error('Error syncing data:', error);
            this.updateSyncStatus('🔴', 'Sync failed');
        }
    }

    showNotification(message) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('sync-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'sync-notification';
            notification.className = 'sync-notification';
            document.body.appendChild(notification);
        }

        notification.textContent = message;
        notification.classList.add('show');

        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    updateSyncStatus(indicator, text) {
        const syncIndicator = document.getElementById('sync-indicator');
        const syncText = document.getElementById('sync-text');

        if (syncIndicator) syncIndicator.textContent = indicator;
        if (syncText) syncText.textContent = text;
    }

    formatSyncTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Data Management
    async loadData() {
        try {
            const response = await fetch('/api/questions');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.questions = await response.json();
        } catch (error) {
            console.error('Error loading questions:', error);
            // Fallback to empty array if API fails
            this.questions = [];
        }
    }

    async saveData() {
        // No longer needed since we save directly through API calls
        // This method is kept for compatibility but does nothing
    }

    // Event Listeners
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => this.handleRefresh());

        // Add question buttons
        document.getElementById('add-question-btn').addEventListener('click', () => this.openQuestionModal());
        document.getElementById('add-question-btn-2').addEventListener('click', () => this.openQuestionModal());

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal('question-modal'));
        document.getElementById('cancel-question').addEventListener('click', () => this.closeModal('question-modal'));
        document.getElementById('close-detail').addEventListener('click', () => this.closeModal('detail-modal'));
        document.getElementById('close-delete').addEventListener('click', () => this.closeModal('delete-modal'));
        document.getElementById('cancel-delete').addEventListener('click', () => this.closeModal('delete-modal'));

        // Form submission
        document.getElementById('question-form').addEventListener('submit', (e) => this.handleQuestionSubmit(e));

        // Search and filters
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('category-filter').addEventListener('change', () => this.updateQuestionsTable());
        document.getElementById('difficulty-filter').addEventListener('change', () => this.updateQuestionsTable());
        document.getElementById('platform-filter').addEventListener('change', () => this.updateQuestionsTable());

        // Table sorting
        document.querySelectorAll('.questions-table th[data-sort]').forEach(th => {
            th.addEventListener('click', (e) => this.handleSort(e.target.dataset.sort));
        });

        // Modal click outside to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Delete confirmation
        document.getElementById('confirm-delete').addEventListener('click', () => this.confirmDelete());

        // Code Archive event listeners
        document.getElementById('add-code-btn').addEventListener('click', () => this.openCodeModal());
        document.getElementById('close-code-modal').addEventListener('click', () => this.closeModal('code-modal'));
        document.getElementById('cancel-code').addEventListener('click', () => this.closeModal('code-modal'));
        document.getElementById('close-code-detail').addEventListener('click', () => this.closeModal('code-detail-modal'));
        document.getElementById('close-delete-code').addEventListener('click', () => this.closeModal('delete-code-modal'));
        document.getElementById('cancel-delete-code').addEventListener('click', () => this.closeModal('delete-code-modal'));
        document.getElementById('confirm-delete-code').addEventListener('click', () => this.confirmDeleteCode());

        // Code form submission
        document.getElementById('code-form').addEventListener('submit', (e) => this.handleCodeSubmit(e));

        // Code archive filters
        document.getElementById('archive-search').addEventListener('input', () => {
            clearTimeout(this.codeSearchTimeout);
            this.codeSearchTimeout = setTimeout(() => this.updateCodeArchive(), 300);
        });
        document.getElementById('language-filter').addEventListener('change', () => this.updateCodeArchive());
        document.getElementById('category-archive-filter').addEventListener('change', () => this.updateCodeArchive());
    }

    // Tab Management
    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        if (tabName === 'statistics') {
            // Delay chart rendering to ensure container is visible
            setTimeout(() => this.updateStatistics(), 100);
        } else if (tabName === 'archive') {
            // Update code archive when switching to archive tab
            setTimeout(() => this.updateCodeArchive(), 100);
        }
    }

    // Dropdown Population
    populateDropdowns() {
        const categories = ["Algorithm","Data Structure", "System Design", "Behavioral", "Database", "Backend", "Design Patterns"];
        const difficulties = ["Easy", "Medium", "Hard"];
        const tags = [
            "Linked List", "Array", "Tree", "Graph", "Dynamic Programming", "Greedy", "Sorting", "Searching",
            "String", "Bit Manipulation", "Math", "Recursion", "Backtracking", "Concurrency", "Object-Oriented Programming",
            "Two Pointers", "Sliding Window", "Hash Table", "Stack", "Queue", "Heap/Priority Queue",
            "Database", "SQL", "NoSQL", "API Design",
            "Prefix-sum", "Disjoint-Set"
        ];

        // Form dropdowns
        this.populateSelect('question-category', categories);
        this.populateSelect('question-difficulty', difficulties);

        // Populate the tag buttons (id: tag-buttons)

        const tagButtonsContainer = document.getElementById('tag-buttons');
        tagButtonsContainer.innerHTML = ''; // Clear existing buttons
        tags.forEach(tag => {
            const button = document.createElement('button');
            button.className = 'btn btn--primary tag-button';
            button.style.margin = '5px';
            button.style.padding = '5px 10px';
            button.textContent = tag;
            button.onclick = (e) => {
                e.preventDefault();
                const input = document.getElementById('question-tags');

                const currentTags = input.value.split(',').map(t => t.trim()).filter(t => t);
                if (!currentTags.includes(tag)) {
                    currentTags.push(tag);
                    input.value = currentTags.join(', ');
                    button.className += ' activeBTN';

                } else {
                    const index = currentTags.indexOf(tag);
                    if (index > -1) {
                        currentTags.splice(index, 1);
                        input.value = currentTags.join(', ');
                        button.className = button.className.replace('activeBTN', '').trim();
                    }
                }
            };
            tagButtonsContainer.appendChild(button);
        });


        // Filter dropdowns
        this.populateSelect('category-filter', categories);
        this.populateSelect('difficulty-filter', difficulties);

        // Platform filter (dynamic based on existing data)
        const platforms = [...new Set(this.questions.map(q => q.platform).filter(p => p))];
        this.populateSelect('platform-filter', platforms);
    }

    populateSelect(elementId, options) {
        const select = document.getElementById(elementId);
        const existingOptions = select.querySelectorAll('option:not(:first-child)');
        existingOptions.forEach(option => option.remove());

        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
    }

    // Modal Management
    openQuestionModal(question = null) {
        this.currentEditId = question ? question.id : null;
        const modal = document.getElementById('question-modal');
        const title = document.getElementById('modal-title');

        title.textContent = question ? 'Edit Question' : 'Add New Question';

        if (question) {
            this.populateForm(question);
        } else {
            this.resetForm();
            document.getElementById('question-date').value = new Date().toISOString().split('T')[0];
        }

        modal.classList.add('show');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
        if (modalId === 'question-modal') {
            this.resetForm();
            this.currentEditId = null;
        } else if (modalId === 'code-modal') {
            document.getElementById('code-form').reset();
            this.currentCodeEditId = null;
        } else if (modalId === 'delete-code-modal') {
            this.currentCodeEditId = null;
        }
    }

    // Form Management
    populateForm(question) {
        document.getElementById('question-title').value = question.title || '';
        document.getElementById('question-description').value = question.description || '';
        document.getElementById('question-link').value = question.link || '';
        document.getElementById('question-category').value = question.category || '';
        document.getElementById('question-difficulty').value = question.difficulty || '';
        document.getElementById('question-platform').value = question.platform || '';
        document.getElementById('question-date').value = question.dateSolved || '';
        document.getElementById('question-hint').value = question.hint || '';
        document.getElementById('question-solution').value = question.solution || '';
        document.getElementById('question-notes').value = question.notes || '';
        document.getElementById('question-tags').value = question.tags ? question.tags.join(', ') : '';
    }

    resetForm() {
        document.getElementById('question-form').reset();
        this.currentEditId = null;
    }

    async handleQuestionSubmit(e) {
        e.preventDefault();

        const formData = {
            title: document.getElementById('question-title').value.trim(),
            description: document.getElementById('question-description').value.trim(),
            link: document.getElementById('question-link').value.trim(),
            category: document.getElementById('question-category').value,
            difficulty: document.getElementById('question-difficulty').value,
            platform: document.getElementById('question-platform').value.trim(),
            dateSolved: document.getElementById('question-date').value,
            hint: document.getElementById('question-hint').value.trim(),
            solution: document.getElementById('question-solution').value.trim(),
            notes: document.getElementById('question-notes').value.trim(),
            tags: document.getElementById('question-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
        };

        if (this.currentEditId) {
            await this.updateQuestion(this.currentEditId, formData);
        } else {
            await this.addQuestion(formData);
        }

        this.closeModal('question-modal');
    }

    async addQuestion(data) {
        try {
            this.updateSyncStatus('🟡', 'Saving...');

            const response = await fetch('/api/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const newQuestion = await response.json();
            this.questions.unshift(newQuestion);
            this.updateAll();
            this.updateSyncStatus('🟢', `Saved (${this.formatSyncTime(new Date())})`);
        } catch (error) {
            console.error('Error adding question:', error);
            this.updateSyncStatus('🔴', 'Save failed');
            alert('Failed to add question. Please try again.');
        }
    }

    async updateQuestion(id, data) {
        try {
            this.updateSyncStatus('🟡', 'Updating...');

            const response = await fetch(`/api/questions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedQuestion = await response.json();
            const index = this.questions.findIndex(q => q.id === id);
            if (index !== -1) {
                this.questions[index] = updatedQuestion;
                this.updateAll();
            }
            this.updateSyncStatus('🟢', `Updated (${this.formatSyncTime(new Date())})`);
        } catch (error) {
            console.error('Error updating question:', error);
            this.updateSyncStatus('🔴', 'Update failed');
            alert('Failed to update question. Please try again.');
        }
    }

    async deleteQuestion(id) {
        try {
            this.updateSyncStatus('🟡', 'Deleting...');

            const response = await fetch(`/api/questions/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.questions = this.questions.filter(q => q.id !== id);
            this.updateAll();
            this.closeModal('detail-modal');
            this.updateSyncStatus('🟢', `Deleted (${this.formatSyncTime(new Date())})`);
        } catch (error) {
            console.error('Error deleting question:', error);
            this.updateSyncStatus('🔴', 'Delete failed');
            alert('Failed to delete question. Please try again.');
        }
    }

    // Search and Filter
    handleSearch(e) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.updateQuestionsTable();
        }, 300);
    }

    getFilteredQuestions() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const difficultyFilter = document.getElementById('difficulty-filter').value;
        const platformFilter = document.getElementById('platform-filter').value;

        return this.questions.filter(question => {
            const matchesSearch = !searchTerm ||
                question.title.toLowerCase().includes(searchTerm) ||
                question.description.toLowerCase().includes(searchTerm) ||
                question.tags.some(tag => tag.toLowerCase().includes(searchTerm));

            const matchesCategory = !categoryFilter || question.category === categoryFilter;
            const matchesDifficulty = !difficultyFilter || question.difficulty === difficultyFilter;
            const matchesPlatform = !platformFilter || question.platform === platformFilter;

            return matchesSearch && matchesCategory && matchesDifficulty && matchesPlatform;
        });
    }

    // Sorting
    handleSort(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort = { field, direction: 'asc' };
        }

        this.updateSortIndicators();
        this.updateQuestionsTable();
    }

    updateSortIndicators() {
        document.querySelectorAll('.sort-indicator').forEach(indicator => {
            indicator.className = 'sort-indicator';
        });

        const activeIndicator = document.querySelector(`th[data-sort="${this.currentSort.field}"] .sort-indicator`);
        if (activeIndicator) {
            activeIndicator.classList.add(this.currentSort.direction);
        }
    }

    sortQuestions(questions) {
        return questions.sort((a, b) => {
            let aVal = a[this.currentSort.field];
            let bVal = b[this.currentSort.field];

            if (this.currentSort.field === 'dateSolved') {
                aVal = new Date(aVal || 0);
                bVal = new Date(bVal || 0);
            }

            if (aVal < bVal) return this.currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Dashboard Updates
    updateDashboard() {
        const total = this.questions.length;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const thisWeek = this.questions.filter(q =>
            new Date(q.dateSolved || q.createdAt) >= weekAgo
        ).length;

        const easy = this.questions.filter(q => q.difficulty === 'Easy').length;
        const medium = this.questions.filter(q => q.difficulty === 'Medium').length;
        const hard = this.questions.filter(q => q.difficulty === 'Hard').length;

        document.getElementById('total-questions').textContent = total;
        document.getElementById('week-questions').textContent = thisWeek;
        document.getElementById('easy-questions').textContent = easy;
        document.getElementById('medium-questions').textContent = medium;
        document.getElementById('hard-questions').textContent = hard;

        this.updateRecentQuestions();
    }

    updateRecentQuestions() {
        const recent = this.questions
            .sort((a, b) => new Date(b.dateSolved || b.createdAt) - new Date(a.dateSolved || a.createdAt))
            .slice(0, 5);

        const container = document.getElementById('recent-questions-list');

        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No questions yet</h3><p>Add your first question to get started!</p></div>';
            return;
        }

        container.innerHTML = recent.map(question => `
            <div class="question-card" onclick="questionBank.showQuestionDetail(${question.id})">
                <div class="question-card-header">
                    <h4>${this.escapeHtml(question.title)}</h4>
                    <div class="question-card-meta">
                        <div>
                            <span class="difficulty-badge difficulty-${question.difficulty.toLowerCase()}">${question.difficulty}</span>
                            <span class="category-badge">${question.category}</span>
                        </div>
                        ${question.tags && question.tags.length > 0 ? `
                            <div class="question-card-tags">
                                ${question.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <p class="question-description">${this.truncateText(this.escapeHtml(question.description), 150)}</p>
                <div class="question-card-footer">
                    <span>${question.platform || 'Unknown Platform'}</span>
                    <span>${this.formatDate(question.dateSolved)}</span>
                </div>
            </div>
        `).join('');
    }

    // Questions Table
    updateQuestionsTable() {
        const filteredQuestions = this.getFilteredQuestions();
        const sortedQuestions = this.sortQuestions(filteredQuestions);
        const tbody = document.getElementById('questions-tbody');

        if (sortedQuestions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><h3>No questions found</h3><p>Try adjusting your search or filters.</p></td></tr>';
            return;
        }

        tbody.innerHTML = sortedQuestions.map(question => `
            <tr>
                <td class="question-title-cell" onclick="questionBank.showQuestionDetail(${question.id})">${this.escapeHtml(question.title)}</td>
                <td>${question.category}</td>
                <td><span class="difficulty-badge difficulty-${question.difficulty.toLowerCase()}">${question.difficulty}</span></td>
                <td>${question.platform || '-'}</td>
                <td>${this.formatDate(question.dateSolved)}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit" onclick="questionBank.editQuestion(${question.id})">Edit</button>
                        <button class="action-btn delete" onclick="questionBank.showDeleteModal(${question.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Question Detail Modal
    showQuestionDetail(id) {
        const question = this.questions.find(q => q.id === id);
        if (!question) return;

        document.getElementById('detail-title').textContent = question.title;

        const content = document.getElementById('detail-content');
        content.innerHTML = `
            <div class="detail-section">
                <div class="detail-meta">
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">Category</span>
                        <span class="detail-meta-value">${question.category}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">Difficulty</span>
                        <span class="detail-meta-value difficulty-badge difficulty-${question.difficulty.toLowerCase()}">${question.difficulty}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">Platform</span>
                        <span class="detail-meta-value">${question.platform || 'Not specified'}</span>
                    </div>
                    <div class="detail-meta-item">
                        <span class="detail-meta-label">Date Solved</span>
                        <span class="detail-meta-value">${this.formatDate(question.dateSolved)}</span>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4>Description</h4>
                <p>${this.escapeHtml(question.description)}</p>
            </div>
            <div class="detail-section">
                <h4>Link</h4>
                <p>
                    ${question.link ? `<a href="${question.link}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(question.link)}</a>` : 'Not specified'}
                </p>
            </div>

            ${question.hint ? `
                <div class="detail-section">
                    <h4>Hint</h4>
                    <p>${this.escapeHtml(question.hint)}</p>
                </div>
            ` : ''}

            ${question.solution ? `
                <div class="detail-section">
                    <h4>Solution</h4>
                    <pre class="code-block"><code>${this.escapeHtml(question.solution)}</code></pre>
                </div>
            ` : ''}

            ${question.notes ? `
                <div class="detail-section">
                    <h4>Personal Notes</h4>
                    <p>${this.escapeHtml(question.notes)}</p>
                </div>
            ` : ''}

            ${question.tags && question.tags.length > 0 ? `
                <div class="detail-section">
                    <h4>Tags</h4>
                    <div class="tags-container">
                        ${question.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        document.getElementById('edit-question').onclick = () => {
            this.closeModal('detail-modal');
            this.openQuestionModal(question);
        };

        document.getElementById('delete-question').onclick = () => {
            this.closeModal('detail-modal');
            this.showDeleteModal(id);
        };

        document.getElementById('detail-modal').classList.add('show');
    }

    editQuestion(id) {
        const question = this.questions.find(q => q.id === id);
        if (question) {
            this.openQuestionModal(question);
        }
    }

    showDeleteModal(id) {
        this.deleteQuestionId = id;
        document.getElementById('delete-modal').classList.add('show');
    }

    async confirmDelete() {
        if (this.deleteQuestionId) {
            await this.deleteQuestion(this.deleteQuestionId);
            this.closeModal('delete-modal');
            this.deleteQuestionId = null;
        }
    }

    // Statistics and Charts
    updateStatistics() {
        this.updateDifficultyChart();
        this.updateCategoryChart();
        this.updateTagsChart();
    }

    updateDifficultyChart() {
        const ctx = document.getElementById('difficulty-chart');
        if (!ctx) return;

        const difficulties = ['Easy', 'Medium', 'Hard'];
        const data = difficulties.map(diff =>
            this.questions.filter(q => q.difficulty === diff).length
        );

        if (this.charts.difficulty) {
            this.charts.difficulty.destroy();
        }

        this.charts.difficulty = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: difficulties,
                datasets: [{
                    data: data,
                    backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateCategoryChart() {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;

        const categoryCount = {};
        this.questions.forEach(q => {
            categoryCount[q.category] = (categoryCount[q.category] || 0) + 1;
        });

        const labels = Object.keys(categoryCount);
        const data = Object.values(categoryCount);

        if (this.charts.category) {
            this.charts.category.destroy();
        }

        this.charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Questions',
                    data: data,
                    backgroundColor: '#1FB8CD'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    updateTagsChart() {
        const ctx = document.getElementById('tags-chart');
        if (!ctx) return;

        // Collect all tags from all questions
        const tagCount = {};
        this.questions.forEach(q => {
            if (q.tags && Array.isArray(q.tags)) {
                q.tags.forEach(tag => {
                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                });
            }
        });

        // Sort tags by count and take top 10
        const sortedTags = Object.entries(tagCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const labels = sortedTags.map(([tag]) => tag);
        const data = sortedTags.map(([, count]) => count);

        if (this.charts.tags) {
            this.charts.tags.destroy();
        }

        // Use horizontal bar chart if we have many tags, otherwise use doughnut
        const chartType = labels.length > 6 ? 'bar' : 'doughnut';

        const chartConfig = {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: chartType === 'bar' ? 'Questions' : '',
                    data: data,
                    backgroundColor: chartType === 'bar' ? '#1FB8CD' : [
                        '#1FB8CD', '#FFC185', '#B4413C', '#4BC0C0', '#FF6384', '#36A2EB',
                        '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: chartType === 'doughnut',
                        position: 'bottom'
                    }
                }
            }
        };

        if (chartType === 'bar') {
            chartConfig.options.indexAxis = 'y'; // Horizontal bars
            chartConfig.options.scales = {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            };
        }

        this.charts.tags = new Chart(ctx, chartConfig);
    }

    // Utility Methods
    updateAll() {
        this.updateDashboard();
        this.updateQuestionsTable();
        this.populateDropdowns();
        this.updateStatistics();
        this.updateCodeArchive();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString();
    }

    async handleRefresh() {
        const refreshBtn = document.getElementById('refresh-btn');
        const originalText = refreshBtn.innerHTML;

        try {
            refreshBtn.innerHTML = '🔄 Syncing...';
            refreshBtn.disabled = true;

            await this.syncData();

            refreshBtn.innerHTML = '✅ Synced!';
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }, 1000);
        } catch (error) {
            refreshBtn.innerHTML = '❌ Failed';
            this.updateSyncStatus('🔴', 'Sync failed');
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.disabled = false;
            }, 2000);
        }
    }

    // Code Archive Management
    async loadCodeSnippets() {
        try {
            const response = await fetch('/api/code-snippets');
            if (response.ok) {
                this.codeSnippets = await response.json();
            } else {
                console.error('Failed to load code snippets from server');
                this.codeSnippets = [];
            }
        } catch (error) {
            console.error('Error loading code snippets:', error);
            this.codeSnippets = [];
        }
    }

    async saveCodeSnippet(snippetData) {
        try {
            const response = await fetch('/api/code-snippets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(snippetData)
            });

            if (response.ok) {
                const newSnippet = await response.json();
                this.codeSnippets.push(newSnippet);
                return newSnippet;
            } else {
                throw new Error('Failed to save code snippet');
            }
        } catch (error) {
            console.error('Error saving code snippet:', error);
            throw error;
        }
    }

    async updateCodeSnippet(id, snippetData) {
        try {
            const response = await fetch(`/api/code-snippets/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(snippetData)
            });

            if (response.ok) {
                const updatedSnippet = await response.json();
                const index = this.codeSnippets.findIndex(s => s.id === id);
                if (index !== -1) {
                    this.codeSnippets[index] = updatedSnippet;
                }
                return updatedSnippet;
            } else {
                throw new Error('Failed to update code snippet');
            }
        } catch (error) {
            console.error('Error updating code snippet:', error);
            throw error;
        }
    }

    async deleteCodeSnippet(id) {
        try {
            const response = await fetch(`/api/code-snippets/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.codeSnippets = this.codeSnippets.filter(s => s.id !== id);
                return true;
            } else {
                throw new Error('Failed to delete code snippet');
            }
        } catch (error) {
            console.error('Error deleting code snippet:', error);
            throw error;
        }
    }

    updateCodeArchive() {
        const grid = document.getElementById('code-archive-grid');
        const searchTerm = document.getElementById('archive-search')?.value.toLowerCase() || '';
        const languageFilter = document.getElementById('language-filter')?.value || '';
        const categoryFilter = document.getElementById('category-archive-filter')?.value || '';

        let filteredSnippets = this.codeSnippets.filter(snippet => {
            const matchesSearch = !searchTerm ||
                snippet.title.toLowerCase().includes(searchTerm) ||
                snippet.description.toLowerCase().includes(searchTerm);
            const matchesLanguage = !languageFilter || snippet.language === languageFilter;
            const matchesCategory = !categoryFilter || snippet.category === categoryFilter;

            return matchesSearch && matchesLanguage && matchesCategory;
        });

        if (filteredSnippets.length === 0) {
            grid.innerHTML = `
                <div class="code-archive-empty">
                    <h3>No code snippets found</h3>
                    <p>Try adjusting your search criteria or add a new code snippet.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredSnippets.map(snippet => `
            <div class="code-card" onclick="questionBank.showCodeDetail(${snippet.id})">
                <div class="code-card-header">
                    <h3 class="code-card-title">${this.escapeHtml(snippet.title)}</h3>
                    <div class="code-card-meta">
                        <span class="language-badge">${snippet.language.toUpperCase()}</span>
                        <span class="category-badge">${snippet.category.replace('-', ' ')}</span>
                    </div>
                </div>
                ${snippet.description ? `
                    <p class="code-card-description">${this.escapeHtml(snippet.description)}</p>
                ` : ''}
                <pre class="code-preview"><code>${this.escapeHtml(this.getCodePreview(snippet.condensedCode))}</code> </pre>
            </div>
        `).join('');
    }

    getCodePreview(code) {
        // Split code into lines and take only first 5 lines
        const lines = code.split('\n');
        const previewLines = lines.slice(0, 5);
        
        // If there are more than 5 lines, add indication
        if (lines.length > 5) {
            return previewLines.join('\n') + '\n ...';
        }
        
        return previewLines.join('\n');
    }

    openCodeModal(snippet = null) {
        this.currentCodeEditId = snippet ? snippet.id : null;

        document.getElementById('code-modal-title').textContent = snippet ? 'Edit Code Snippet' : 'Add Code Snippet';

        // Populate form fields
        document.getElementById('code-title').value = snippet ? snippet.title : '';
        document.getElementById('code-language').value = snippet ? snippet.language : '';
        document.getElementById('code-category').value = snippet ? snippet.category : '';
        document.getElementById('code-description').value = snippet ? snippet.description : '';
        document.getElementById('code-condensed').value = snippet ? snippet.condensedCode : '';
        document.getElementById('code-complexity').value = snippet ? snippet.complexity : '';

        document.getElementById('code-modal').classList.add('show');
    }

    async handleCodeSubmit(e) {
        e.preventDefault();

        const formData = {
            title: document.getElementById('code-title').value.trim(),
            language: document.getElementById('code-language').value,
            category: document.getElementById('code-category').value,
            description: document.getElementById('code-description').value.trim(),
            condensedCode: document.getElementById('code-condensed').value.trim(),
            complexity: document.getElementById('code-complexity').value.trim()
        };

        if (!formData.title || !formData.language || !formData.category || !formData.condensedCode) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            if (this.currentCodeEditId) {
                // Edit existing snippet
                await this.updateCodeSnippet(this.currentCodeEditId, formData);
                this.showNotification('Code snippet updated successfully!');
            } else {
                // Add new snippet
                await this.saveCodeSnippet(formData);
                this.showNotification('Code snippet added successfully!');
            }

            this.updateCodeArchive();
            this.closeModal('code-modal');
            this.currentCodeEditId = null;
        } catch (error) {
            alert('Error saving code snippet. Please try again.');
            console.error('Error in handleCodeSubmit:', error);
        }
    }

    showCodeDetail(id) {
        const snippet = this.codeSnippets.find(s => s.id === id);
        if (!snippet) return;

        document.getElementById('code-detail-title').textContent = snippet.title;

        const content = document.getElementById('code-detail-content');
        content.innerHTML = `
            <div class="code-detail-meta">
                <div class="code-detail-meta-item">
                    <span class="code-detail-meta-label">Language</span>
                    <span class="code-detail-meta-value language-badge">${snippet.language.toUpperCase()}</span>
                </div>
                <div class="code-detail-meta-item">
                    <span class="code-detail-meta-label">Category</span>
                    <span class="code-detail-meta-value category-badge">${snippet.category.replace('-', ' ')}</span>
                </div>
                <div class="code-detail-meta-item">
                    <span class="code-detail-meta-label">Added</span>
                    <span class="code-detail-meta-value">${this.formatDate(snippet.createdAt)}</span>
                </div>
            </div>

            ${snippet.description ? `
                <div class="code-detail-section">
                    <h4>Description</h4>
                    <p>${this.escapeHtml(snippet.description)}</p>
                </div>
            ` : ''}

            ${snippet.complexity ? `
                <div class="code-detail-section">
                    <h4>Complexity</h4>
                    <p>${this.escapeHtml(snippet.complexity)}</p>
                </div>
            ` : ''}

            <div class="code-detail-section">
            <h4>Code</h4>
                <pre class="code-block" id="code-display-${id}"><code>${this.escapeHtml(snippet.condensedCode)}</code></pre>
            </div>
        `;

        document.getElementById('edit-code').onclick = () => {
            this.closeModal('code-detail-modal');
            this.openCodeModal(snippet);
        };

        document.getElementById('delete-code').onclick = () => {
            this.closeModal('code-detail-modal');
            this.showDeleteCodeModal(id);
        };

        document.getElementById('code-detail-modal').classList.add('show');
    }

    toggleCodeVersion(version, id) {
        const snippet = this.codeSnippets.find(s => s.id === id);
        if (!snippet) return;

        // Update toggle buttons
        document.querySelectorAll('.version-toggle').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        // Update code display
        const codeDisplay = document.getElementById(`code-display-${id}`);
        const code = snippet.condensedCode;
        codeDisplay.innerHTML = `<code>${this.escapeHtml(code)}</code>`;
    }

    showDeleteCodeModal(id) {
        this.currentCodeEditId = id;
        document.getElementById('delete-code-modal').classList.add('show');
    }

    async confirmDeleteCode() {
        if (!this.currentCodeEditId) return;

        try {
            await this.deleteCodeSnippet(this.currentCodeEditId);
            this.updateCodeArchive();
            this.closeModal('delete-code-modal');
            this.showNotification('Code snippet deleted successfully!');
            this.currentCodeEditId = null;
        } catch (error) {
            alert('Error deleting code snippet. Please try again.');
            console.error('Error in confirmDeleteCode:', error);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    const questionBank = new QuestionBank();
    await questionBank.init();
    window.questionBank = questionBank; // Make it globally accessible for onclick handlers
});