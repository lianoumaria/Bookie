import express from "express";
import session from "express-session";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import pw from "./secrets.js";

const app = express();
const port = 3000;
const API_URL = "the book cover API";

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);

//Initial login page
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/home");
  }
  res.render("login.ejs");
});

// this must either post /login with name = login or signin
app.post("/", (req, res) => {
  const userName = req.body.username;
  const passWord = req.body.pword;
  const btnAction = req.body.login ? "login" : req.body.signin ? "signin" : null;
  const foundUser = users.find((user) => user.username === userName);

  if (!btnAction) {
    return res.render("login.ejs", { error: "Invalid action" });
  }

  if (!foundUser) {
    if (btnAction === "login") {
      return res.render("login.ejs", { error: "User doesn't exist" });
    }

    // sign in as new user
    users.push({ username: userName, password: passWord });
    req.session.user = { username: userName };
    return res.redirect("/home");
  }

  if (btnAction === "signin") {
    return res.render("login.ejs", { error: "Username already in use" });
  }

  if (foundUser.password !== passWord) {
    return res.render("login.ejs", { error: "Wrong password" });
  }

  req.session.user = { username: userName };
  res.redirect("/home");
});

app.get("/signout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

//Delete an account
// app.delete('/account', (req, res) => {
//   const username = req.session.user.username;
//   db.query("DELETE FROM users WHERE username = ?", [username], (err) => {
//     if (err) return res.status(500).json({ error: err });
//     req.session.destroy((err) => {  // log them out
//       if (err) return res.status(500).json({ error: err });
//       res.json({ success: true });  // then send response
//     });
//   });
// });

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

//Home page should give the choice to filter the books as well as list all of them
app.get("/home", requireLogin, (req, res) => {
  let currentUser = req.session.user.username;
  let bookList = books; // SELECT * FROM books
  res.render("home.ejs", {
    books: bookList,
    user: currentUser,
  });
});

app.get("/review/:id", requireLogin, (req, res) => {
  const selectedISBN = req.params.id;
  let selectedBook = books.find((book) => book.ISBN === selectedISBN);
  let bookReviews = reviews.filter((review) => review.review_isbn === selectedISBN);

  res.render("reviews.ejs", {
    book: selectedBook,
    reviews: bookReviews,
    user: req.session.user.username,
  });
});

app.post("/review/:id", requireLogin, (req, res) => {
  const selectedISBN = req.params.id;
  const newReview = {
    id: reviews.length + 1,
    review_user: req.session.user.username,
    review_isbn: selectedISBN,
    comment: req.body.comment,
    rating: req.body.rating,
  };
  reviews.push(newReview);
  res.redirect(`/review/${selectedISBN}`);
});

app.get("/books", requireLogin, (req, res) => {
  const currentUser = req.session.user.username;
  const bookList = books.filter((book) => book.reader === currentUser);
  res.render("myBooks.ejs", {
    books: bookList,
    user: currentUser,
  });
});

app.post("/books", requireLogin, (req, res) => {
  const currentUser = req.session.user.username;
  const newBook = {
    ISBN: req.body.isbn,
    title: req.body.bookTitle,
    author: req.body.authorName,
    book_description: req.body.description,
    category: req.body.category,
    post_date: req.body.releaseDate,
    reader: currentUser,
  };
  books.push(newBook);
  res.redirect("/books");
});

app.listen(port, (req, res) => {
    console.log(`Server running on port ${port}`);
});


let reviews = [
  {
    id: 1,
    review_user: "john123",
    review_isbn: "9780140449136",
    comment: "Amazing classic adventure.",
    rating: 5
  },
  {
    id: 2,
    review_user: "alice",
    review_isbn: "9780061120084",
    comment: "Thought-provoking and emotional.",
    rating: 5
  },
  {
    id: 3,
    review_user: "bob22",
    review_isbn: "9780451524935",
    comment: "A bit dark but very relevant.",
    rating: 4
  },
  {
    id: 4,
    review_user: "emma",
    review_isbn: "9780743273565",
    comment: "Beautiful writing style.",
    rating: 4
  },
  {
    id: 5,
    review_user: "mike99",
    review_isbn: "9780547928227",
    comment: "Fun fantasy read.",
    rating: 5
  },
  {
    id: 6,
    review_user: "john123",
    review_isbn: "9780451524935",
    comment: "Really makes you think.",
    rating: 5
  },
  {
    id: 7,
    review_user: "alice",
    review_isbn: "9780547928227",
    comment: "Great characters and world-building.",
    rating: 4
  }
];

let books = [
  {
    ISBN: "9780140449136",
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    book_description: "A psychological novel following Rodion Raskolnikov, a former student who commits a murder and struggles with guilt, morality, and redemption.",
    category: "Fiction",
    post_date: "1993-01-28",
    reader: "john123"
  },
  {
    ISBN: "9780061120084",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    book_description: "A story about justice, prejudice, and childhood in the American South.",
    category: "Social",
    post_date: "2006-05-23",
    reader: "john123"
  },
  {
    ISBN: "9780451524935",
    title: "1984",
    author: "George Orwell",
    book_description: "A dystopian novel about surveillance and totalitarianism.",
    category: "Thriller",
    post_date: "1950-07-01",
    reader: "bob22"
  },
  {
    ISBN: "9780743273565",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    book_description: "A tragic tale of wealth, love, and the American Dream.",
    category: "Romance",
    post_date: "2004-09-30",
    reader: "bob22"
  },
  {
    ISBN: "9780547928227",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    book_description: "Bilbo Baggins embarks on an adventure with dwarves and a wizard.",
    category: "Fiction",
    post_date: "2012-09-18",
    reader: "bob22"
  },
  {
    ISBN: "9781466373453",
    title: "Programming Basics",
    author: "Jane Smith",
    book_description: "An introduction to programming concepts and problem solving.",
    category: "Informative",
    post_date: "2021-03-15",
    reader: "mike99"
  },
  {
    ISBN: "9781982137274",
    title: "Funny Business",
    author: "Mark Taylor",
    book_description: "A collection of humorous stories about office life.",
    category: "Comedy",
    post_date: "2020-08-10",
    reader: "emma"
  }
];

let users = [
  {
    username: "john123",
    password: "pass123"
  },
  {
    username: "alice",
    password: "alice789"
  },
  {
    username: "bob22",
    password: "bob456"
  },
  {
    username: "emma",
    password: "emma123"
  },
  {
    username: "mike99",
    password: "mike999"
  }
];