const mongoose = require("mongoose");
const helper = require("./test_helper");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);
const Blog = require("../models/blog");
const bcrypt = require("bcrypt");
const User = require("../models/user");

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(helper.initialBlogs);
});

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("the amount of blogs is correct", async () => {
  const response = await api.get("/api/blogs");
  expect(response.body).toHaveLength(helper.initialBlogs.length);
});

test("a valid blog can be added", async () => {
  const newBlog = {
    title: "I am a valid blog",
    author: "Valid Valid",
    url: "https://valid.valid",
    likes: 344,
  };

  await api
    .post("/api/blogs")
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1);

  const authors = blogsAtEnd.map(b => b.author);
  expect(authors).toContain("Valid Valid");
});

test("Individual blog id is named id", async () => {
  const blogsAtEnd = await helper.blogsInDb();
  blogsAtEnd.map(b => expect(b.id).toBeDefined());
  //console.log(ids);
});

test("The default number of likes is 0", async () => {
  const newBlog = {
    title: "No likes is defined",
    author: "Blogger Blogger",
    url: "https://blogger.blogger",
  };

  await api.post("/api/blogs").send(newBlog).expect(201);

  const blogsAtEnd = await helper.blogsInDb();

  blogWithNoLikes = blogsAtEnd.find(b => b.author === "Blogger Blogger");
  //console.log(blogWithNoLikes);
  expect(blogWithNoLikes.likes).toBe(0);
});

test("400 Bad request if title is missing", async () => {
  const newBlog = {
    author: "Blogger Blogger",
    url: "https://blogger.blogger",
  };

  await api.post("/api/blogs").send(newBlog).expect(400);
});

test("400 Bad request if url is missing", async () => {
  const newBlog = {
    title: "Blog without url",
    author: "Blogger Blogger",
  };

  await api.post("/api/blogs").send(newBlog).expect(400);
});

test("a blog can be deleted", async () => {
  const blogAtStart = await helper.blogsInDb();
  const blogToDelete = blogAtStart[0];

  await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);

  expect(blogsAtEnd).not.toContain(blogToDelete);
});

test("a blog can be updated", async () => {
  const blogsAtStart = await helper.blogsInDb();
  const blogToUpdate = blogsAtStart[0];
  const updatedBlog = {
    title: "I am an updated blog",
    author: "Updated Updated",
    url: "https://updated.updated",
    likes: 5790,
  };

  await api.put(`/api/blogs/${blogToUpdate.id}`).send(updatedBlog).expect(200);

  const blogsAtEnd = await helper.blogsInDb();
  expect(blogsAtEnd).toHaveLength(blogsAtStart.length);
  const updatedBlogInDb = blogsAtEnd.find(blog => blog.id === blogToUpdate.id);

  expect(updatedBlog.title).toBe(updatedBlogInDb.title);
  expect(updatedBlog.author).toBe(updatedBlogInDb.author);
  expect(updatedBlog.url).toBe(updatedBlogInDb.url);
  expect(updatedBlog.likes).toBe(updatedBlogInDb.likes);
});

describe("when there is initially one user at db", () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });

    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: "nuser",
      name: "New User",
      password: "salainen",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length + 1);

    const usernames = usersAtEnd.map(u => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test("creation fails with proper statuscode and message if username already taken", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "salainen",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain("expected `username` to be unique");

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length);
  });

  test("creation fails with proper statuscode and message if username doesn't exist", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      name: "Two Characters",
      password: "secretpw",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("content-Type", /application\/json/);

    expect(result.body.error).toContain("Path `username` is required.");

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length);
  });

  test("creation fails with proper statuscode and message if username is less than three characters long", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: "tc",
      name: "Two Characters",
      password: "secretpw",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("content-Type", /application\/json/);

    expect(result.body.error).toContain(
      "is shorter than the minimum allowed length (3)."
    );

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length);
  });

  test("creation fails with proper statuscode and message if password is less than three characters long", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: "tcharacters",
      name: "Two Characters",
      password: "pw",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain("at least three characters long");

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length);
  });
  test("creation fails with proper statuscode and message if password doesn't exist", async () => {
    const userAtStart = await helper.usersInDb();

    const newUser = {
      username: "nopsw",
      name: "No Password",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    expect(result.body.error).toContain("at least three characters long");

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(userAtStart.length);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
