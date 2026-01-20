# Mango - Profile Management Application

A Node.js web application for managing personality profiles with MongoDB persistence. Built with Express, Mongoose, and EJS templating.

## Project Structure

```
app.js                          # Main application entry point
db.js                          # MongoDB connection and in-memory server setup
package.json                   # Project dependencies and scripts
jest.config.js                 # Jest testing configuration
models/
  └── Profile.js               # Mongoose Profile schema
routes/
  └── profile.js               # Profile routes (GET, POST)
tests/
  ├── profile.test.js          # Comprehensive test suite
  └── setup.js                 # Test setup and teardown
views/
  ├── profile_template.ejs     # Main profile template
  └── partials/                # EJS partial templates
      ├── header.ejs
      ├── footer.ejs
      ├── metadata.ejs
      ├── styles.ejs
      ├── scripts.ejs
      ├── profile_card.ejs
      ├── prologue.ejs
      ├── epilogue.ejs
      └── categories.ejs
public/
  └── static/                  # Static assets
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14+)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository.
2. Install dependencies:

    ```sh
    npm install
    ```

### Running the Application

Start the server with:

```sh
npm start
```

or

```sh
node app.js
```

The application will start on the default port (usually 3000). Open your browser and navigate to http://localhost:3000.

## Features

### Database
- **MongoDB Integration**: Profile data is stored in MongoDB using Mongoose ODM
- **In-Memory Testing**: Uses mongodb-memory-server for isolated testing without external database setup
- **Auto-Initialization**: Database automatically creates a default profile on first run

### API Routes

#### GET / (Root Path)
Displays the default profile (ID 1).

```bash
curl http://localhost:3000/
```

#### GET /:id
Retrieves and displays a specific profile by ID.

```bash
curl http://localhost:3000/1
curl http://localhost:3000/2
```

**Features:**
- Handles any numeric profile ID
- Returns 404 if profile doesn't exist
- Gracefully handles invalid IDs by defaulting to profile 1

#### POST /
Creates a new profile with auto-generated ID.

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "description": "A sample profile",
    "mbti": "ENFP",
    "enneagram": "7w6",
    "variant": "sx/so",
    "tritype": 729,
    "socionics": "IEE",
    "sloan": "SCUAI",
    "psyche": "LEVF"
  }'
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "_id": "...",
    "id": 2,
    "name": "John Doe",
    "description": "A sample profile",
    "mbti": "ENFP",
    "enneagram": "7w6",
    "variant": "sx/so",
    "tritype": 729,
    "socionics": "IEE",
    "sloan": "SCUAI",
    "psyche": "LEVF",
    "image": "https://soulverse.boo.world/images/1.png",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Supported Fields:**
- `name` (string) - Profile name
- `description` (string) - Profile description
- `mbti` (string) - MBTI type
- `enneagram` (string) - Enneagram type
- `variant` (string) - Variant type
- `tritype` (number) - Tritype number
- `socionics` (string) - Socionics type
- `sloan` (string) - SLOAN personality type
- `psyche` (string) - Psyche type

**Features:**
- Automatically generates next available ID
- Assigns default image to all profiles
- Accepts JSON and form-encoded data
- Persists data to MongoDB

### Profile Model

Each profile contains:
```javascript
{
  id: Number (unique, required),
  name: String (required),
  description: String,
  mbti: String,
  enneagram: String,
  variant: String,
  tritype: Number,
  socionics: String,
  sloan: String,
  psyche: String,
  image: String,
  timestamps: { createdAt, updatedAt }
}
```

## Testing

Run the comprehensive test suite with:

```sh
npm test
```

### Test Coverage

The test suite includes **25+ test cases** covering:

**GET / Route Tests:**
- Renders default profile
- Auto-initializes database with default profile

**GET /:id Route Tests:**
- Retrieves profile by specific ID
- Returns 404 for non-existent profiles
- Handles invalid IDs gracefully
- Handles special characters in URL

**POST / Route Tests:**
- Creates profile with all fields
- Creates profile with minimal fields
- Auto-generates next ID correctly
- Converts tritype to integer
- Assigns default image
- Persists profile to database
- Handles JSON and form data

**Database Tests:**
- Ensures default profile is created only once
- Preserves existing profiles on subsequent requests

All tests use **mongodb-memory-server** for isolated, fast testing without requiring a real MongoDB instance.

## Development

### Technologies Used

- **Backend Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Template Engine**: EJS
- **Testing**: Jest + Supertest
- **In-Memory Database**: mongodb-memory-server

### Project Overview
- **Entry Point**: app.js
- **Routes**: routes/profile.js
- **Models**: models/Profile.js (Mongoose schema)
- **Database Setup**: db.js
- **Views**: EJS templates in views/ and partials
- **Static Files**: Served from public/static/
- **Tests**: tests/profile.test.js with comprehensive coverage

### Scripts

```json
{
  "start": "node app.js",
  "test": "jest --detectOpenHandles --forceExit"
}
```

## License