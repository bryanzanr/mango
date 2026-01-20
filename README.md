# Mango - Profile Management & Community System

A Node.js web application for managing personality profiles with community features including comments and voting. Built with Express, Mongoose, EJS, and MongoDB for data persistence.

## Overview

Mango is a REST API-based application that allows users to:
- Create and manage user accounts
- View personality profiles
- Post and manage comments on profiles
- Vote (like/dislike) on comments
- Sort and filter comments by various criteria

The application uses:
- **Backend Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose ODM
- **In-Memory Testing**: mongodb-memory-server for isolated testing
- **Template Engine**: EJS for rendering profile pages

## Database Architecture

### Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
├─────────────────┤
│ _id (ObjectId)  │
│ name (String)   │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
        │
        │ (1:Many)
        │
        ├───────────────────────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│    Comment       │          │     Profile      │
├──────────────────┤          ├──────────────────┤
│ _id (ObjectId)   │          │ _id (ObjectId)   │
│ profileId        ├──────────┤ id (Number)      │
│ authorId         │ (Many:1) │ name (String)    │
│ authorName       │          │ description      │
│ authorAvatar     │          │ mbti             │
│ content          │          │ enneagram        │
│ parentCommentId  │          │ variant          │
│ upvoteCount      │          │ tritype          │
│ downvoteCount    │          │ socionics        │
│ replyCount       │          │ sloan            │
│ isEdited         │          │ psyche           │
│ isDeleted        │          │ image            │
│ editedAt         │          │ createdAt        │
│ createdAt        │          │ updatedAt        │
│ updatedAt        │          └──────────────────┘
└──────────────────┘
        │
        │ (1:Many)
        │
        ▼
┌──────────────────┐
│      Vote        │
├──────────────────┤
│ _id (ObjectId)   │
│ commentId        │──────┐ References Comment
│ userId           │      │
│ voteType (-1,1)  │      │
│ createdAt        │      │
└──────────────────┘      │
                    References User via userId
```

### Relationships

- **User → Comment** (1:Many) - Users can create multiple comments
- **Profile → Comment** (1:Many) - Profiles receive multiple comments  
- **Comment → Comment** (1:Many) - Comments can have nested replies via parentCommentId
- **Comment → Vote** (1:Many) - Comments can have multiple votes
- **User → Vote** (Implicit) - Users identified by userId in Vote collection

### Key Design Features

1. **Soft Deletes** - Comments are marked as deleted instead of removed
2. **Nested Comments** - Support for threaded discussions via parentCommentId
3. **Vote Aggregation** - Vote counts are denormalized in Comment for fast queries
4. **Auto-Counters** - Reply count automatically maintained on parent comments

## Key Design Decisions

1. **API-First Architecture** - All data operations go through REST API endpoints
2. **No Authentication Required** - Users are identified by passing `userId` parameter (simulated auth)
3. **Soft Deletes** - Deleted comments are marked as deleted rather than permanently removed
4. **Automatic Vote Management** - Clicking the same vote type removes the vote (toggle behavior)
5. **Threaded Comments** - Support for nested replies with automatic reply counting
6. **Default Images** - All users and profiles use default images (no file uploads)
7. **Pagination Support** - All list endpoints support pagination for scalability
8. **User Isolation** - Anyone can use any user account (no password protection)

## Project Structure

```
app.js                          # Main application entry point
db.js                          # MongoDB connection and in-memory server setup
package.json                   # Project dependencies and scripts
jest.config.js                 # Jest testing configuration
models/
  ├── Profile.js               # Mongoose Profile schema
  ├── Comment.js               # Mongoose Comment schema
  ├── Vote.js                  # Mongoose Vote schema
  └── User.js                  # Mongoose User schema
routes/
  ├── profile.js               # Profile routes (GET, POST by ID)
  ├── comments.js              # Comment routes (CRUD operations)
  ├── votes.js                 # Vote routes (like/unlike)
  └── users.js                 # User account routes
tests/
  ├── profile.test.js          # Profile functionality tests
  ├── comments.test.js         # Comments and votes tests
  └── users.test.js            # User account tests
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

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd mango
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the server:
    ```bash
    npm start
    ```
    or
    ```bash
    node app.js
    ```

The application will start on port 3000. Open your browser and navigate to `http://localhost:3000` to view the default profile.

### Running Tests

Execute the comprehensive test suite:

```bash
npm test
```

The test suite includes:
- 15+ User account tests
- 25+ Comment and voting tests
- 20+ Profile tests
- Total: 60+ test cases with full coverage

## API Documentation

### Users API

#### Create User Account
**POST** `/api/users`

Create a new user account with only a name.

Request Body:
```json
{
  "name": "John Doe"
}
```

Response (201 Created):
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "createdAt": "2026-01-20T10:00:00.000Z"
  }
}
```

#### Get User by ID
**GET** `/api/users/:userId`

Retrieve a specific user account by ID.

Response (200 OK):
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "createdAt": "2026-01-20T10:00:00.000Z"
  }
}
```

#### List All Users
**GET** `/api/users?page=1&limit=50`

Retrieve all user accounts with pagination support.

Response (200 OK):
```json
{
  "success": true,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "createdAt": "2026-01-20T10:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "createdAt": "2026-01-20T10:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 2,
    "pages": 1
  }
}
```

### Profiles API

#### Get Default Profile
**GET** `/`

Display the default profile (ID 1).

#### Get Profile by ID
**GET** `/:id`

Retrieve and display a specific profile by ID.

Examples:
```bash
curl http://localhost:3000/1      # View profile 1
curl http://localhost:3000/2      # View profile 2
```

#### Create New Profile
**POST** `/api/profiles`

Create a new profile (via REST API).

Request Body:
```json
{
  "name": "New Profile",
  "description": "Profile description",
  "mbti": "ENFP",
  "enneagram": "7w6",
  "variant": "sx/so",
  "tritype": 729,
  "socionics": "IEE",
  "sloan": "SCUAI",
  "psyche": "LEVF"
}
```

### Comments API

#### Create Comment
**POST** `/api/:profileId/comments`

Post a new comment on a profile.

Request Body:
```json
{
  "authorId": "user-id-123",
  "authorName": "John Doe",
  "content": "Great personality profile!",
  "parentCommentId": null,
  "authorAvatar": "https://example.com/avatar.jpg"
}
```

Response (201 Created):
```json
{
  "success": true,
  "comment": {
    "_id": "507f1f77bcf86cd799439011",
    "profileId": 1,
    "authorId": "user-id-123",
    "authorName": "John Doe",
    "authorAvatar": "https://example.com/avatar.jpg",
    "content": "Great personality profile!",
    "parentCommentId": null,
    "upvoteCount": 0,
    "downvoteCount": 0,
    "replyCount": 0,
    "isEdited": false,
    "userVote": 0,
    "createdAt": "2026-01-20T10:00:00.000Z",
    "updatedAt": "2026-01-20T10:00:00.000Z"
  }
}
```

#### List Comments
**GET** `/api/:profileId/comments?sortBy=newest&page=1&limit=20&userId=user-id-123`

Retrieve comments for a profile with sorting and pagination.

Query Parameters:
- `sortBy`: `newest` (default), `oldest`, `toprated`, `mostreplies`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `userId`: Optional - to include user's vote information
- `parentCommentId`: Optional - filter by parent comment for replies

Response (200 OK):
```json
{
  "success": true,
  "comments": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "profileId": 1,
      "authorId": "user-id-123",
      "authorName": "John Doe",
      "authorAvatar": "https://example.com/avatar.jpg",
      "content": "Great profile!",
      "parentCommentId": null,
      "upvoteCount": 5,
      "downvoteCount": 1,
      "replyCount": 2,
      "isEdited": false,
      "userVote": 1,
      "createdAt": "2026-01-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

#### Get Single Comment with Replies
**GET** `/api/:profileId/comments/:commentId?userId=user-id-123`

Retrieve a single comment with all its direct replies.

Response (200 OK):
```json
{
  "success": true,
  "comment": {
    "_id": "507f1f77bcf86cd799439011",
    "profileId": 1,
    "authorId": "user-id-123",
    "authorName": "John Doe",
    "content": "Great profile!",
    "upvoteCount": 5,
    "downvoteCount": 1,
    "userVote": 1,
    "createdAt": "2026-01-20T10:00:00.000Z"
  },
  "replies": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "authorId": "user-id-456",
      "authorName": "Jane Smith",
      "content": "I agree!",
      "parentCommentId": "507f1f77bcf86cd799439011",
      "upvoteCount": 2,
      "downvoteCount": 0,
      "userVote": 0,
      "createdAt": "2026-01-20T10:05:00.000Z"
    }
  ]
}
```

#### Edit Comment
**PUT** `/api/:profileId/comments/:commentId`

Edit a comment (only your own).

Request Body:
```json
{
  "content": "Updated comment text",
  "authorId": "user-id-123"
}
```

Response (200 OK):
```json
{
  "success": true,
  "comment": {
    "_id": "507f1f77bcf86cd799439011",
    "content": "Updated comment text",
    "isEdited": true,
    "editedAt": "2026-01-20T10:10:00.000Z"
  }
}
```

#### Delete Comment
**DELETE** `/api/:profileId/comments/:commentId`

Delete a comment (soft delete, only your own).

Request Body:
```json
{
  "authorId": "user-id-123"
}
```

Response (200 OK):
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

### Voting API

#### Vote on Comment
**POST** `/api/:profileId/comments/:commentId/vote`

Like (upvote) or dislike (downvote) a comment. Clicking the same vote type removes the vote.

Request Body:
```json
{
  "userId": "user-id-123",
  "voteType": 1
}
```

Parameters:
- `voteType`: `1` for upvote (like), `-1` for downvote (dislike)

Response (200 OK):
```json
{
  "success": true,
  "comment": {
    "_id": "507f1f77bcf86cd799439011",
    "upvoteCount": 6,
    "downvoteCount": 1,
    "userVote": 1
  }
}
```

**Vote Behavior:**
- First upvote: Increments `upvoteCount` to 1
- Upvote again: Removes vote, `upvoteCount` returns to 0, `userVote` becomes 0
- Switch from upvote to downvote: `upvoteCount` decrements, `downvoteCount` increments

#### Get Vote Summary
**GET** `/api/:profileId/comments/:commentId/votes?userId=user-id-123`

Get vote statistics for a comment.

Response (200 OK):
```json
{
  "success": true,
  "votes": {
    "upvoteCount": 5,
    "downvoteCount": 1,
    "netScore": 4,
    "userVote": 1
  }
}
```

#### Remove Vote
**DELETE** `/api/:profileId/comments/:commentId/vote`

Explicitly remove your vote from a comment.

Request Body:
```json
{
  "userId": "user-id-123"
}
```

Response (200 OK):
```json
{
  "success": true,
  "comment": {
    "_id": "507f1f77bcf86cd799439011",
    "upvoteCount": 4,
    "downvoteCount": 1,
    "userVote": 0
  }
}
```

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  createdAt: Date,
  updatedAt: Date
}
```

### Profile Model
```javascript
{
  _id: ObjectId,
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
  createdAt: Date,
  updatedAt: Date
}
```

### Comment Model
```javascript
{
  _id: ObjectId,
  profileId: Number (required),
  authorId: String (required),
  authorName: String (required),
  authorAvatar: String,
  content: String (required),
  parentCommentId: ObjectId (null for top-level),
  upvoteCount: Number (default: 0),
  downvoteCount: Number (default: 0),
  replyCount: Number (default: 0),
  isEdited: Boolean (default: false),
  isDeleted: Boolean (default: false),
  editedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Vote Model
```javascript
{
  _id: ObjectId,
  commentId: ObjectId (required, indexed),
  userId: String (required),
  voteType: Number (1 for upvote, -1 for downvote),
  createdAt: Date
}
```

## Technologies Used

- **Runtime**: Node.js
- **Backend Framework**: Express.js (4.17.1+)
- **Database**: MongoDB with Mongoose ODM (7.0.0+)
- **Template Engine**: EJS (3.1.6+)
- **Testing**: Jest (29.0.0+) & Supertest (6.3.0+)
- **In-Memory DB**: mongodb-memory-server (9.0.0+) for testing

## Available Scripts

```json
{
  "start": "node app.js",
  "test": "jest --detectOpenHandles --forceExit"
}
```

- `npm start` - Start the Express server
- `npm test` - Run the test suite

## Important Notes

1. **No Authentication Required** - The application uses simple userId strings for user identification. In production, implement proper JWT or session-based authentication.

2. **No File Uploads** - Profile avatars and images are set to default URLs. Implement multer or similar for file upload functionality.

3. **Database Cleanup** - mongodb-memory-server automatically cleans up after tests. In production, use a persistent MongoDB instance.

4. **Soft Deletes** - Deleted comments are marked with `isDeleted: true` rather than being permanently removed. This preserves referential integrity for vote counts and reply relationships.

5. **Vote Management** - Voting on a comment you already voted on removes the vote (toggle behavior). To switch votes, simply vote with the opposite vote type.

6. **Reply Tracking** - Parent comments automatically track the number of direct replies via the `replyCount` field, updated when replies are created or deleted.

## Built With

- [Express.js](https://expressjs.com/) - Web application framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Mongoose](https://mongoosejs.com/) - MongoDB object modeling
- [Jest](https://jestjs.io/) - JavaScript testing framework
- [Node.js](https://nodejs.org/) - JavaScript runtime environment

## API Testing with Postman

We provide a complete Postman API collection for testing all endpoints. This allows you to:
- Test all API endpoints without writing code
- Use pre-defined request templates
- Store and reuse environment variables
- Generate API documentation

### Importing the Collection

1. Download [mango.postman_collection.json](mango.postman_collection.json) from the repository
2. Open Postman and click **Import** in the top-left corner
3. Select the downloaded JSON file
4. All endpoints will be organized by resource (Users, Profiles, Comments, Votes)

### Environment Setup (Optional)

Create a Postman environment with these variables:
```
baseUrl = http://localhost:3000
userId = 1
profileId = 1
commentId = <comment_id_from_response>
```

Then select this environment before running requests - all endpoints will use these variables.

### Example Workflow

1. **Create a User**: POST `/users` → copy the returned `_id`
2. **List Profiles**: GET `/profiles` → identify a profile ID
3. **Post a Comment**: POST `/profiles/:id/comments` → copy the returned comment `_id`
4. **Vote on Comment**: POST `/comments/:id/votes` → toggle votes
5. **View Comment Votes**: GET `/comments/:id/votes` → see voting summary

## Authors

- **Bryanza Novirahman** - [GitHub](https://github.com/bryanzanr)

## License

This project is licensed under the ISC License - see the LICENSE file for details.