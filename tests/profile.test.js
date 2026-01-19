'use strict';

process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const Profile = require('../models/Profile');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  await Profile.deleteMany({});
});

// Teardown after all tests
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('GET / - Root Path', () => {
  test('should render default profile (ID 1) on root path', async () => {
    // Create a default profile
    await Profile.create({
      id: 1,
      name: "A Martinez",
      description: "Adolph Larrue Martinez III.",
      mbti: "ISFJ",
      enneagram: "9w3",
      variant: "sp/so",
      tritype: 725,
      socionics: "SEE",
      sloan: "RCOEN",
      psyche: "FEVL",
      image: "https://soulverse.boo.world/images/1.png",
    });

    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('A Martinez');
  });

  test('should automatically create default profile on first request if none exists', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('A Martinez');
    
    const profile = await Profile.findOne({ id: 1 });
    expect(profile).toBeDefined();
    expect(profile.name).toBe('A Martinez');
  });
});

describe('GET /:id - Get Profile by ID', () => {
  beforeEach(async () => {
    // Create test profiles
    await Profile.create({
      id: 1,
      name: "A Martinez",
      description: "Adolph Larrue Martinez III.",
      mbti: "ISFJ",
      enneagram: "9w3",
      variant: "sp/so",
      tritype: 725,
      socionics: "SEE",
      sloan: "RCOEN",
      psyche: "FEVL",
      image: "https://soulverse.boo.world/images/1.png",
    });

    await Profile.create({
      id: 2,
      name: "John Doe",
      description: "A sample profile",
      mbti: "ENFP",
      enneagram: "7w6",
      variant: "sx/so",
      tritype: 729,
      socionics: "IEE",
      sloan: "SCUAI",
      psyche: "LEVF",
      image: "https://soulverse.boo.world/images/1.png",
    });
  });

  test('should render profile with ID 1', async () => {
    const response = await request(app).get('/1');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('A Martinez');
  });

  test('should render profile with ID 2', async () => {
    const response = await request(app).get('/2');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('John Doe');
  });

  test('should return 404 when profile does not exist', async () => {
    const response = await request(app).get('/999');
    
    expect(response.status).toBe(404);
    expect(response.text).toContain('not found');
  });

  test('should handle invalid ID gracefully (non-numeric)', async () => {
    const response = await request(app).get('/invalid');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('A Martinez'); // Should default to profile 1
  });

  test('should handle special characters in URL', async () => {
    const response = await request(app).get('/@#$');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('A Martinez'); // Should default to profile 1
  });
});

describe('POST / - Create Profile', () => {
  beforeEach(async () => {
    // Ensure database has at least one profile for ID generation
    await Profile.create({
      id: 1,
      name: "A Martinez",
      description: "Adolph Larrue Martinez III.",
      mbti: "ISFJ",
      enneagram: "9w3",
      variant: "sp/so",
      tritype: 725,
      socionics: "SEE",
      sloan: "RCOEN",
      psyche: "FEVL",
      image: "https://soulverse.boo.world/images/1.png",
    });
  });

  test('should create a new profile with all fields', async () => {
    const newProfile = {
      name: "Jane Smith",
      description: "A new profile",
      mbti: "INTJ",
      enneagram: "5w4",
      variant: "sp/sx",
      tritype: 513,
      socionics: "LIE",
      sloan: "RCOEI",
      psyche: "LEVF",
    };

    const response = await request(app).post('/').send(newProfile);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.profile).toBeDefined();
    expect(response.body.profile.id).toBe(2); // Next available ID
    expect(response.body.profile.name).toBe('Jane Smith');
    expect(response.body.profile.image).toBe('https://soulverse.boo.world/images/1.png');
  });

  test('should create profile with minimal fields', async () => {
    const newProfile = {
      name: "Minimal Profile",
    };

    const response = await request(app).post('/').send(newProfile);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.profile.name).toBe('Minimal Profile');
    expect(response.body.profile.id).toBe(2);
  });

  test('should auto-generate next ID correctly', async () => {
    // Create another profile first
    await Profile.create({
      id: 2,
      name: "Second Profile",
      description: "Another profile",
      mbti: "ENFP",
      enneagram: "7w6",
      variant: "sx/so",
      tritype: 729,
      socionics: "IEE",
      sloan: "SCUAI",
      psyche: "LEVF",
      image: "https://soulverse.boo.world/images/1.png",
    });

    const newProfile = {
      name: "Third Profile",
      description: "Testing ID generation",
      mbti: "ESFJ",
      enneagram: "2w3",
      variant: "so/sx",
      tritype: 271,
      socionics: "ESE",
      sloan: "SCOAI",
      psyche: "LEVF",
    };

    const response = await request(app).post('/').send(newProfile);
    
    expect(response.status).toBe(200);
    expect(response.body.profile.id).toBe(3);
  });

  test('should convert tritype to integer', async () => {
    const newProfile = {
      name: "Test Profile",
      tritype: "729",
    };

    const response = await request(app).post('/').send(newProfile);
    
    expect(response.status).toBe(200);
    expect(response.body.profile.tritype).toBe(729);
    expect(typeof response.body.profile.tritype).toBe('number');
  });

  test('should assign default image to all profiles', async () => {
    const newProfile = {
      name: "Test Profile",
      description: "Test",
    };

    const response = await request(app).post('/').send(newProfile);
    
    expect(response.status).toBe(200);
    expect(response.body.profile.image).toBe('https://soulverse.boo.world/images/1.png');
  });

  test('should persist created profile to database', async () => {
    const newProfile = {
      name: "Persistence Test",
      description: "Test persistence",
      mbti: "ISTJ",
    };

    const response = await request(app).post('/').send(newProfile);
    
    expect(response.status).toBe(200);
    
    // Verify profile is in database
    const savedProfile = await Profile.findOne({ id: 2 });
    expect(savedProfile).toBeDefined();
    expect(savedProfile.name).toBe('Persistence Test');
  });

  test('should handle JSON and form data', async () => {
    const newProfile = {
      name: "JSON Test",
      description: "Testing JSON",
      mbti: "ENFJ",
    };

    // Test JSON
    const jsonResponse = await request(app)
      .post('/')
      .set('Content-Type', 'application/json')
      .send(newProfile);
    
    expect(jsonResponse.status).toBe(200);
    expect(jsonResponse.body.success).toBe(true);

    // Clean up
    await Profile.deleteMany({});
    await Profile.create({
      id: 1,
      name: "A Martinez",
      mbti: "ISFJ",
      image: "https://soulverse.boo.world/images/1.png",
    });

    // Test form data
    const formResponse = await request(app)
      .post('/')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('name=Form Test&description=Testing Form&mbti=ESFP');
    
    expect(formResponse.status).toBe(200);
    expect(formResponse.body.success).toBe(true);
  });
});

describe('Database Initialization', () => {
  test('should create default profile only once on first request', async () => {
    // First request
    await request(app).get('/');
    
    let profiles = await Profile.find({});
    expect(profiles.length).toBe(1);
    
    // Second request should not create another
    await request(app).get('/');
    
    profiles = await Profile.find({});
    expect(profiles.length).toBe(1);
  });

  test('should not override existing profiles on subsequent requests', async () => {
    // Create two profiles
    await Profile.create({
      id: 1,
      name: "Profile 1",
      mbti: "ISFJ",
      image: "https://soulverse.boo.world/images/1.png",
    });

    await Profile.create({
      id: 2,
      name: "Profile 2",
      mbti: "ENFP",
      image: "https://soulverse.boo.world/images/1.png",
    });

    // Make a request
    await request(app).get('/');
    
    // Verify both profiles still exist
    const profiles = await Profile.find({});
    expect(profiles.length).toBe(2);
  });
});
