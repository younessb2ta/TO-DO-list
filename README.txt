# Todo List Application

## Project Status
✅ Core functionality implemented  
🛠 Planned enhancements in progress

## Features Implemented
- Task creation with description and due date
- Task completion marking (with visual feedback)
- Task deletion
- Responsive UI with modern design
- Persistent storage using MySQL

## Technical Stack
### Frontend
- **HTML5**: Application structure
- **CSS3**: Styling and responsive design
- **Vanilla JavaScript**: DOM manipulation and API calls

### Backend
- **Node.js**: Runtime environment
- **Express**: Web server framework
- **MySQL**: Database for data persistence

## Installation Guide
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up MySQL database:
   ```sql
   CREATE DATABASE todo_db;
   USE todo_db;
   CREATE TABLE tasks (
     id INT AUTO_INCREMENT PRIMARY KEY,
     task_text VARCHAR(255) NOT NULL,
     due_date DATETIME,
     completed BOOLEAN DEFAULT FALSE
   );
   ```

## Running the Application
1. Start the server: `node server.js`
2. Access the application at: `http://localhost:5000`

## API Documentation
| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/tasks` | GET | Get all tasks | - |
| `/api/tasks` | POST | Create new task | `{text, dueDate}` |
| `/api/tasks/:id` | DELETE | Delete a task | - |
| `/api/tasks/:id` | PUT | Update task status | `{completed}` |

## Development Roadmap
- [ ] Task editing functionality
- [ ] Filtering system (active/completed)
- [ ] Task counter
- [ ] Dark/light mode toggle
- [ ] Sorting options

## Project Structure
```
project-root/
├── public/          # Frontend files
│   ├── index.html   # Main interface
│   ├── style.css    # Stylesheet
│   └── app.js       # Frontend logic
├── server.js        # Backend server
└── package.json     # Project configuration
