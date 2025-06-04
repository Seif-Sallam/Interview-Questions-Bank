const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 8195;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Database setup
const dbPath = path.join(__dirname, 'questions.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        link TEXT,
        category TEXT,
        difficulty TEXT,
        platform TEXT,
        dateSolved TEXT,
        hint TEXT,
        solution TEXT,
        notes TEXT,
        tags TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    )`);

    // Create code snippets table
    db.run(`CREATE TABLE IF NOT EXISTS code_snippets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        language TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        condensedCode TEXT NOT NULL,
        complexity TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    )`);

    // Insert sample data if table is empty
    db.get("SELECT COUNT(*) as count FROM questions", (err, row) => {
        if (err) {
            console.error('Error checking table:', err);
            return;
        }

        if (row.count === 0) {
            console.log('Inserting sample data...');
            const sampleQuestions = [
                {
                    title: "Two Sum",
                    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
                    link: "https://leetcode.com/problems/two-sum/",
                    category: "Algorithm",
                    difficulty: "Easy",
                    platform: "LeetCode",
                    dateSolved: "2024-05-15",
                    hint: "Use a hash map to store numbers and their indices as you iterate through the array.",
                    solution: "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
                    notes: "Time complexity: O(n), Space complexity: O(n). Remember to check for the complement first before adding to map.",
                    tags: JSON.stringify(["hash-map", "array"]),
                    createdAt: "2024-05-15T10:30:00Z",
                    updatedAt: "2024-05-15T10:30:00Z"
                },
                {
                    title: "Tell me about yourself",
                    description: "Common behavioral interview question asking for a brief professional summary",
                    link: "",
                    category: "Behavioral",
                    difficulty: "Easy",
                    platform: "Google Interview",
                    dateSolved: "2024-05-20",
                    hint: "Structure using present, past, future framework and focus on relevant experience.",
                    solution: "Hi, I'm a software engineer with 3 years of experience building scalable web applications. Currently, I work at XYZ Company where I lead the development of our user authentication system using React and Node.js. Previously, I completed my CS degree and several internships where I gained experience in full-stack development. I'm passionate about solving complex problems and am looking to join a team where I can contribute to innovative products while continuing to grow as an engineer.",
                    notes: "Keep it concise (1-2 minutes), practice the delivery, connect to the role you're applying for.",
                    tags: JSON.stringify(["introduction", "behavioral"]),
                    createdAt: "2024-05-20T14:15:00Z",
                    updatedAt: "2024-05-20T14:15:00Z"
                },
                {
                    title: "Design a URL Shortener",
                    description: "Design a system like bit.ly that takes long URLs and returns short URLs, and redirects short URLs to original URLs.",
                    link: "",
                    category: "System Design",
                    difficulty: "Medium",
                    platform: "Amazon Interview",
                    dateSolved: "2024-05-25",
                    hint: "Consider scalability, database design, caching, and URL encoding strategies. Think about read vs write heavy workload.",
                    solution: "Key components:\n1. URL encoding service (Base62 encoding)\n2. Database design (URL mappings table)\n3. Caching layer (Redis for popular URLs)\n4. Load balancers\n5. CDN for global distribution\n6. Analytics service\n7. Rate limiting\n\nDatabase schema:\nurl_mappings: id, short_url, long_url, created_at, expires_at, user_id\nanalytics: id, short_url, timestamp, ip_address, user_agent",
                    notes: "Discussed trade-offs between different encoding strategies, importance of caching for read-heavy workload, and handling of expired URLs.",
                    tags: JSON.stringify(["system-design", "scalability", "database"]),
                    createdAt: "2024-05-25T16:45:00Z",
                    updatedAt: "2024-05-25T16:45:00Z"
                }
            ];

            const stmt = db.prepare(`INSERT INTO questions (
                title, description, link, category, difficulty, platform, dateSolved,
                hint, solution, notes, tags, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            sampleQuestions.forEach(question => {
                stmt.run(
                    question.title, question.description, question.link, question.category,
                    question.difficulty, question.platform, question.dateSolved, question.hint,
                    question.solution, question.notes, question.tags, question.createdAt, question.updatedAt
                );
            });            stmt.finalize();
            console.log('Sample data inserted successfully');
        }
    });

    // Insert sample code snippets if table is empty
    db.get("SELECT COUNT(*) as count FROM code_snippets", (err, row) => {
        if (err) {
            console.error('Error checking code_snippets table:', err);
            return;
        }

        if (row.count === 0) {
            console.log('Inserting sample code snippets...');
            const sampleCodeSnippets = [
                {
                    title: "Binary Search",
                    language: "cpp",
                    category: "searching",
                    description: "Search for a target value in a sorted array using binary search algorithm",
                    condensedCode: `int binarySearch(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,

                    complexity: "Time: O(log n), Space: O(1)",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    title: "Quick Sort",
                    language: "cpp",
                    category: "sorting",
                    description: "Efficient divide-and-conquer sorting algorithm",
                    condensedCode: `void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}`,

                    complexity: "Time: O(n log n) average, O(n²) worst case, Space: O(log n)",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    title: "Binary Search",
                    language: "python",
                    category: "searching",
                    description: "Python implementation of binary search algorithm",
                    condensedCode: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,

                    complexity: "Time: O(log n), Space: O(1)",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    title: "Union Find",
                    language: "cpp",
                    category: "data-structures",
                    description: "Disjoint Set Union data structure with path compression and union by rank",
                    condensedCode: `class UnionFind {
    vector<int> parent, rank;
public:
    UnionFind(int n) : parent(n), rank(n, 0) {
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    void unite(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return;
        if (rank[px] < rank[py]) swap(px, py);
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
    }

    bool connected(int x, int y) {
        return find(x) == find(y);
    }
};`,

                    complexity: "Time: O(α(n)) per operation, Space: O(n)",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    title: "Find First Negative",
                    language: "python",
                    category: "array",
                    description: "Find the first negative number in an array",
                    condensedCode: `def find_first_negative(arr):
    for i, num in enumerate(arr):
        if num < 0:
            return i
    return -1`,

                    complexity: "Time: O(n), Space: O(1)",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];

            const stmt = db.prepare(`INSERT INTO code_snippets
                (title, language, category, description, condensedCode, complexity, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

            sampleCodeSnippets.forEach(snippet => {
                stmt.run(
                    snippet.title, snippet.language, snippet.category, snippet.description,
                    snippet.condensedCode, snippet.complexity,
                    snippet.createdAt, snippet.updatedAt
                );
            });

            stmt.finalize();
            console.log('Sample code snippets inserted successfully');
        }
    });
});

// API Routes

// Get all questions
app.get('/api/questions', (req, res) => {
    db.all("SELECT * FROM questions ORDER BY id DESC", (err, rows) => {
        if (err) {
            console.error('Error fetching questions:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Parse tags JSON for each question
        const questions = rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : []
        }));

        res.json(questions);
    });
});

// Get a single question by ID
app.get('/api/questions/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM questions WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('Error fetching question:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }

        // Parse tags JSON
        const question = {
            ...row,
            tags: row.tags ? JSON.parse(row.tags) : []
        };

        res.json(question);
    });
});

// Create a new question
app.post('/api/questions', (req, res) => {
    const {
        title, description, link, category, difficulty, platform, dateSolved,
        hint, solution, notes, tags
    } = req.body;

    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    const tagsJson = JSON.stringify(tags || []);

    db.run(`INSERT INTO questions (
        title, description, link, category, difficulty, platform, dateSolved,
        hint, solution, notes, tags, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, link, category, difficulty, platform, dateSolved,
     hint, solution, notes, tagsJson, createdAt, updatedAt],
    function(err) {
        if (err) {
            console.error('Error creating question:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Return the created question
        db.get("SELECT * FROM questions WHERE id = ?", [this.lastID], (err, row) => {
            if (err) {
                console.error('Error fetching created question:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            const question = {
                ...row,
                tags: row.tags ? JSON.parse(row.tags) : []
            };

            res.status(201).json(question);
        });
    });
});

// Update a question
app.put('/api/questions/:id', (req, res) => {
    const id = req.params.id;
    const {
        title, description, link, category, difficulty, platform, dateSolved,
        hint, solution, notes, tags
    } = req.body;

    if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
    }

    const updatedAt = new Date().toISOString();
    const tagsJson = JSON.stringify(tags || []);

    db.run(`UPDATE questions SET
        title = ?, description = ?, link = ?, category = ?, difficulty = ?,
        platform = ?, dateSolved = ?, hint = ?, solution = ?, notes = ?,
        tags = ?, updatedAt = ?
        WHERE id = ?`,
    [title, description, link, category, difficulty, platform, dateSolved,
     hint, solution, notes, tagsJson, updatedAt, id],
    function(err) {
        if (err) {
            console.error('Error updating question:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }

        // Return the updated question
        db.get("SELECT * FROM questions WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Error fetching updated question:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            const question = {
                ...row,
                tags: row.tags ? JSON.parse(row.tags) : []
            };

            res.json(question);
        });
    });
});

// Delete a question
app.delete('/api/questions/:id', (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM questions WHERE id = ?", [id], function(err) {
        if (err) {
            console.error('Error deleting question:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }

        res.json({ message: 'Question deleted successfully' });
    });
});

// Code Snippets API Routes

// Get all code snippets
app.get('/api/code-snippets', (req, res) => {
    db.all("SELECT * FROM code_snippets ORDER BY id DESC", (err, rows) => {
        if (err) {
            console.error('Error fetching code snippets:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        res.json(rows);
    });
});

// Get a single code snippet by ID
app.get('/api/code-snippets/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM code_snippets WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('Error fetching code snippet:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (!row) {
            res.status(404).json({ error: 'Code snippet not found' });
            return;
        }

        res.json(row);
    });
});

// Create a new code snippet
app.post('/api/code-snippets', (req, res) => {
    const {
        title, language, category, description, condensedCode, complexity
    } = req.body;

    if (!title || !language || !category || !condensedCode) {
        res.status(400).json({ error: 'Title, language, category, and condensed code are required' });
        return;
    }

    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    db.run(`INSERT INTO code_snippets
        (title, language, category, description, condensedCode, complexity, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, language, category, description, condensedCode, complexity, createdAt, updatedAt],
    function(err) {
        if (err) {
            console.error('Error creating code snippet:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        // Return the created code snippet
        db.get("SELECT * FROM code_snippets WHERE id = ?", [this.lastID], (err, row) => {
            if (err) {
                console.error('Error fetching created code snippet:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            res.status(201).json(row);
        });
    });
});

// Update a code snippet
app.put('/api/code-snippets/:id', (req, res) => {
    const id = req.params.id;
    const {
        title, language, category, description, condensedCode, complexity
    } = req.body;

    if (!title || !language || !category || !condensedCode) {
        res.status(400).json({ error: 'Title, language, category, and condensed code are required' });
        return;
    }

    const updatedAt = new Date().toISOString();

    db.run(`UPDATE code_snippets SET
        title = ?, language = ?, category = ?, description = ?,
        condensedCode = ?, complexity = ?, updatedAt = ?
        WHERE id = ?`,
    [title, language, category, description, condensedCode, complexity, updatedAt, id],
    function(err) {
        if (err) {
            console.error('Error updating code snippet:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: 'Code snippet not found' });
            return;
        }

        // Return the updated code snippet
        db.get("SELECT * FROM code_snippets WHERE id = ?", [id], (err, row) => {
            if (err) {
                console.error('Error fetching updated code snippet:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            res.json(row);
        });
    });
});

// Delete a code snippet
app.delete('/api/code-snippets/:id', (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM code_snippets WHERE id = ?", [id], function(err) {
        if (err) {
            console.error('Error deleting code snippet:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }

        if (this.changes === 0) {
            res.status(404).json({ error: 'Code snippet not found' });
            return;
        }

        res.json({ message: 'Code snippet deleted successfully' });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Closing database connection...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

app.listen(PORT, '0.0.0.0',() => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Database initialized successfully');
});