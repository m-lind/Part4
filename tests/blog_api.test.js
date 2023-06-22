const mongoose = require("mongoose");
const helper = require("./test_helper");
const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);
const Blog = require("../models/blog");

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

afterAll(async () => {
  await mongoose.connection.close();
});
