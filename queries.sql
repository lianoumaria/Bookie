CREATE TYPE categories AS ENUM (
    'Fiction', 
    'Comedy', 
    'Thriller', 
    'Informative', 
    'Romance', 
    'Social'
);

CREATE TABLE users (
    username VARCHAR(10) PRIMARY KEY,
    password VARCHAR(10),
);

CREATE TABLE books (
    ISBN CHAR(13) PRIMARY KEY,
    title VARCHAR(50),
    author VARCHAR(50),
    book_description TEXT,
    category categories,
    post_date DATE 
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    review_user VARCHAR(10) REFERENCES users(username),
    review_isbn CHAR(13) REFERENCES books(ISBN),
    comment TEXT,
    rating INTEGER CHECK (rating>0 AND rating<6)
);