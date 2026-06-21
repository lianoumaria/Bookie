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
//create a secrets.js file with you postgres password or write it here
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "bookie",
  password: pw,
  port: 5432
});

db.connect();

//Initial login page
app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/home");
  }
  res.render("login.ejs");
});

// this must either post / with name = login or signin
app.post("/", async (req, res) => {
  const userName = req.body.username;
  const passWord = req.body.pword;
  const btnAction = req.body.login ? "login" : req.body.signin ? "signin" : null;
  
  //No button pressed
  if (!btnAction) {
     return res.render("login.ejs", { error: "Invalid action" });
  }

  try {
    //Try to get db info
    const result = await db.query("SELECT * FROM users WHERE users.username = $1", [
      userName
    ]);  

    let foundUser = result.rows[0];

    //Not an existing username
    if (!foundUser) {
      //You cannot login, you don't exist
      if (btnAction === "login") {
        return res.render("login.ejs", { error: "User doesn't exist" });
      }
      
      // sign in as new user
      try {
        await db.query("INSERT INTO users VALUES ($1, $2)",[
          userName,
          passWord
        ]);
        req.session.user = { username: userName };
        return res.redirect("/home");
      } catch (exception) {
        return res.render("login.ejs", { error: "Unable to create user" });
      }
    }
    //If the username exists in the db you cannot create a user with the same username
    if (btnAction === "signin") {
      return res.render("login.ejs", { error: "Username already in use" });
    }
    //You cannot login you a wrong password
    if (foundUser.password !== passWord) {
      return res.render("login.ejs", { error: "Wrong password" });
    }
    //If the username and pasword match you go to the home page
    req.session.user = { username: userName };
    res.redirect("/home");
  } catch (exception) {
    return res.send('Internal Server Error').status(500);
  };
});

//The sign out button destroys the session so the user no longer has access to the site's functionality
app.get("/signout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

//Delete an account
app.delete('/account', requireLogin, async (req, res) => {
  const username = req.session.user.username;
  try {
    await db.query("DELETE FROM users WHERE username = $1", [username]);
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ success: false, error: 'Failed to destroy session' });
      }
      return res.status(200).json({ success: true });
    });
  } catch (exception) {
    console.log(exception);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

//Set a function to handle the required username to access functionality
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/");
  }
  next();
}

//Home page should give the choice to filter the books as well as list all of them
app.get("/home", requireLogin, async (req, res) => {
  let currentUser = req.session.user.username;
  
  //Try to get books from the database, iclude an average rating that comes from the review average
  try {
    const result = await db.query("SELECT b.isbn, b.title, b.author, b.post_date, b.book_description, b.category, AVG(r.rating) AS avg_rating FROM books b LEFT JOIN reviews r ON b.isbn = r.review_isbn GROUP BY b.isbn, b.title, b.author");
    const bookList = result.rows;
    res.render("home.ejs", {
      books: bookList,
      user: currentUser,
    });
  } catch (exception) {
    res.send('Internal server error').status(500);
  };
});

//Handle the filter action
app.post("/home/filter", requireLogin, async (req, res) => {
  let currentUser = req.session.user.username;

  let filters = [];
  let finalFilter = "";
  let bookList = [];

  if (req.body.bookTitle != '') {
    filters.push(`b.title LIKE '%' || '${req.body.bookTitle}' || '%'`);
  }
  if (req.body.authorName != '') {
    filters.push(`b.author LIKE '%' || '${req.body.authorName}' || '%'`);
  }
  if (req.body.category != undefined) {
    filters.push(`b.category = '${req.body.category}'`);
  }

  for (let i=0; i<filters.length; i++) {
    if (i===0) {
      console.log(i)
      finalFilter = finalFilter + "WHERE "+ filters[i];
    } else {
      finalFilter = finalFilter + " and " + filters[i]; 
    }
  };

  if (req.body.sortBy == '') {
    console.log('no sort', "SELECT * FROM books b "+finalFilter);
    try {
      const result = await db.query("SELECT * FROM books b "+finalFilter);
      bookList = result.rows;
    } catch (exception) {
      console.log(exception);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    };
  } else if (req.body.sortBy === 'postDate') {
    console.log('postDate', "SELECT * FROM books b "+finalFilter+" ORDER BY post_date DESC");
    try {
      const result1 = await db.query("SELECT * FROM books b "+finalFilter+" ORDER BY post_date DESC");
      bookList = result1.rows;
    } catch (exception) {
      console.log(exception);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    };
  } else if  (req.body.sortBy === 'bestReview') {
    console.log('review', "SELECT b.isbn, b.title, b.author, b.post_date, b.category, AVG(r.rating) AS avg_rating FROM books b LEFT JOIN reviews r ON b.isbn = r.review_isbn "+ finalFilter +" GROUP BY b.isbn, b.title, b.author, b.post_date, b.category ORDER BY avg_rating DESC NULLS LAST;" );
    try {
      const result2 = await db.query("SELECT b.isbn, b.title, b.author, b.post_date, b.category, AVG(r.rating) AS avg_rating FROM books b LEFT JOIN reviews r ON b.isbn = r.review_isbn	"+ finalFilter +" GROUP BY b.isbn, b.title, b.author, b.post_date, b.category ORDER BY avg_rating DESC NULLS LAST;");
      bookList = result2.rows;
    } catch (exception) {
      console.log(exception);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    } ;
  } else {
    return res.redirect('/home');
  }
  res.render("home.ejs", {
    books: bookList,
    user: currentUser,
  });
})

app.get("/review/:id", requireLogin, async (req, res) => {
  const selectedISBN = req.params.id;
  let selectedBook;
  let bookReviews;
  
  try {
    const result1 = await db.query("Select * from books WHERE isbn = $1", [
      selectedISBN
    ]); 
    selectedBook = result1.rows[0];
  } catch (exception) {
    res.send('Internal server error').status(500);
  }

  try {
    const result2 = await db.query("Select * from reviews WHERE review_isbn = $1", [
      selectedISBN
    ]); 
    bookReviews = result2.rows;
  } catch (exception) {
    res.send('Internal server error').status(500);
  }

  res.render("reviews.ejs", {
    book: selectedBook,
    reviews: bookReviews,
    user: req.session.user.username,
  });
});

app.post("/review/:id", requireLogin, async (req, res) => {
  const selectedISBN = req.params.id;
  const newReview = {
    review_user: req.session.user.username,
    review_isbn: selectedISBN,
    comment: req.body.comment,
    rating: req.body.rating,
  };
  
  //Try to create insert an new review into reviews table
  try {
    await db.query("INSERT INTO reviews (review_user, review_isbn, comment, rating) VALUES ($1, $2, $3, $4)", [
      req.session.user.username,
      selectedISBN,
      req.body.comment,
      req.body.rating
    ]);
    res.redirect(`/review/${selectedISBN}`);
  } catch (exception) {
    res.send('Internal server error').status(500);
  };

});

app.get("/books", requireLogin, async (req, res) => {
  const currentUser = req.session.user.username;
  try {
    console.log("i will try to fetch books")
    const result = await db.query("SELECT * FROM books WHERE reader = $1", [
      currentUser
    ]);
    console.log(result);
    const bookList = result.rows;

    res.render("myBooks.ejs", {
      books: bookList,
      user: currentUser,
    });

  } catch (exception) {
    console.log(exception);
    res.send("Internal server error").status(500);
  };
});

app.post("/books", requireLogin, async (req, res) => {
  const currentUser = req.session.user.username;

  try {
    await db.query("INSERT INTO books VALUES ($1, $2, $3, $4, $5, $6, $7)",[
      req.body.isbn,
      req.body.bookTitle,
      req.body.authorName,
      req.body.description,
      req.body.category,
      req.body.releaseDate,
      currentUser
    ]);
    res.redirect("/books");
  } catch (exception) {
    console.log(exception);
    res.send("Internal server error").status(500);
  }
  
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