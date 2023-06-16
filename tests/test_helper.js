const Blog = require("../models/blog");

const initialBlogs = [
  {
    title: "2ality",
    author: "Axel Rauschmayer",
    url: "https://2ality.com/",
    likes: 344,
  },
  {
    title: "Raganwald",
    author: "Reginald Braithwaite",
    url: "http://raganwald.com/",
    likes: 345,
  },
];

const nonExistingId = async () => {
  const blog = new Blog({ title: "willremovethissoon" });
  await blog.save();
  await blog.remove();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map(blog => blog.toJSON());
};

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
};