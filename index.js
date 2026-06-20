import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import pw from "./secrets.js";

const app = express();
const port = 3000;
const API_URL = "the book cover API";
let userName;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Initial login page
app.get("/", (req,res) => {
    res.render("login.ejs");
});

// this must either post /login with name = login or signin
app.post("/login", (req, res) => {
    //find the btn that was pushed
    const btnAction = Object.keys(req.body)[2];
    userName = req.body.username;
    let passWord = req.body.pword;
    let foundUser = users.find(user => user.username===userName);

    if (foundUser == undefined) {
        switch (btnAction) {
            case "login":
                res.render("login.ejs", {
                    error: "User doesn't exist"
                });
                break;
            case "signin":
                try {
                    console.log("INSERT users VALUES ($1,$2); [userName, passWord]");
                    res.redirect("/home");
                } catch {
                    console.log("DB error");
                }
                break;
        }
    } else {
        switch (btnAction) {
            case "login":
                if (foundUser.password === passWord) {
                    res.redirect("/home");
                } else {
                    res.render("login.ejs", {
                        error: "Wrong password"
                    });
                }
                break;
            case "signin":
                    res.render("login.ejs", {
                        error: "Username already in use"
                    });
                break;
            }
    }
});

app.get("/signout", (req, res) => {
    userName = undefined;
    res.render("login.ejs");
})

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

//Home page should give the choice to filter the books as well as list all of them
app.get("/home", (req, res) => {
    let bookList = books //SELECT * FROM books
    
    res.render("home.ejs", {
        books: bookList
    });
});

app.get("/review/:id", (req, res) => {
    const selectedISBN = req.params.id;
    console.log(selectedISBN);
})


app.listen(port, (req, res) => {
    console.log(`Server running on port ${port}`);
});


const reviews = [
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

const books = [
  {
    ISBN: "9780140449136",
    title: "The Odyssey",
    author: "Homer",
    book_description: "An epic journey of Odysseus returning home after the Trojan War.",
    category: "Fiction",
    post_date: "1996-11-01"
  },
  {
    ISBN: "9780061120084",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    book_description: "A story about justice, prejudice, and childhood in the American South.",
    category: "Social",
    post_date: "2006-05-23"
  },
  {
    ISBN: "9780451524935",
    title: "1984",
    author: "George Orwell",
    book_description: "A dystopian novel about surveillance and totalitarianism.",
    category: "Thriller",
    post_date: "1950-07-01"
  },
  {
    ISBN: "9780743273565",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    book_description: "A tragic tale of wealth, love, and the American Dream.",
    category: "Romance",
    post_date: "2004-09-30"
  },
  {
    ISBN: "9780547928227",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    book_description: "Bilbo Baggins embarks on an adventure with dwarves and a wizard.",
    category: "Fiction",
    post_date: "2012-09-18"
  },
  {
    ISBN: "9781466373453",
    title: "Programming Basics",
    author: "Jane Smith",
    book_description: "An introduction to programming concepts and problem solving.",
    category: "Informative",
    post_date: "2021-03-15"
  },
  {
    ISBN: "9781982137274",
    title: "Funny Business",
    author: "Mark Taylor",
    book_description: "A collection of humorous stories about office life.",
    category: "Comedy",
    post_date: "2020-08-10"
  }
];

const users = [
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