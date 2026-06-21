DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS categories CASCADE;

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
    password VARCHAR(10)
);

CREATE TABLE books (
    ISBN CHAR(13) PRIMARY KEY,
    title VARCHAR(50),
    author VARCHAR(50),
    book_description TEXT,
    category categories,
    post_date DATE,
    reader VARCHAR(10) REFERENCES users(username)
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    review_user VARCHAR(10) REFERENCES users(username),
    review_isbn CHAR(13) REFERENCES books(ISBN),
    comment TEXT,
    rating INTEGER CHECK (rating>0 AND rating<6)
);

-- USERS
INSERT INTO users (username, password) VALUES
('john123', 'pass123'),
('alice', 'alice789'),
('bob22', 'bob456'),
('emma', 'emma123'),
('mike99', 'mike999');

-- BOOKS
INSERT INTO books (
    isbn,
    title,
    author,
    book_description,
    category,
    post_date,
    reader
) VALUES
(
    '9780140449136',
    'Crime and Punishment',
    'Fyodor Dostoevsky',
    'A psychological novel following Rodion Raskolnikov, a former student who commits a murder and struggles with guilt, morality, and redemption.',
    'Fiction',
    '1993-01-28',
    'john123'
),
(
    '9780061120084',
    'To Kill a Mockingbird',
    'Harper Lee',
    'A story about justice, prejudice, and childhood in the American South.',
    'Social',
    '2006-05-23',
    'john123'
),
(
    '9780451524935',
    '1984',
    'George Orwell',
    'A dystopian novel about surveillance and totalitarianism.',
    'Thriller',
    '1950-07-01',
    'bob22'
),
(
    '9780743273565',
    'The Great Gatsby',
    'F. Scott Fitzgerald',
    'A tragic tale of wealth, love, and the American Dream.',
    'Romance',
    '2004-09-30',
    'bob22'
),
(
    '9780547928227',
    'The Hobbit',
    'J.R.R. Tolkien',
    'Bilbo Baggins embarks on an adventure with dwarves and a wizard.',
    'Fiction',
    '2012-09-18',
    'bob22'
),
(
    '9781466373453',
    'Programming Basics',
    'Jane Smith',
    'An introduction to programming concepts and problem solving.',
    'Informative',
    '2021-03-15',
    'mike99'
),
(
    '9781982137274',
    'Funny Business',
    'Mark Taylor',
    'A collection of humorous stories about office life.',
    'Comedy',
    '2020-08-10',
    'emma'
);

-- REVIEWS
INSERT INTO reviews (
    id,
    review_user,
    review_isbn,
    comment,
    rating
) VALUES
(
    1,
    'john123',
    '9780140449136',
    'Amazing classic adventure.',
    5
),
(
    2,
    'alice',
    '9780061120084',
    'Thought-provoking and emotional.',
    5
),
(
    3,
    'bob22',
    '9780451524935',
    'A bit dark but very relevant.',
    4
),
(
    4,
    'emma',
    '9780743273565',
    'Beautiful writing style.',
    4
),
(
    5,
    'mike99',
    '9780547928227',
    'Fun fantasy read.',
    5
),
(
    6,
    'john123',
    '9780451524935',
    'Really makes you think.',
    5
),
(
    7,
    'alice',
    '9780547928227',
    'Great characters and world-building.',
    4
);

-- Order by total_rating without saving the avg(rating) --
-- SELECT
--     b.isbn,
--     b.title,
--     b.author,
--     AVG(r.rating) AS avg_rating
-- FROM books b
-- LEFT JOIN reviews r
--     ON b.isbn = r.review_isbn
-- 	WHERE b.author LIKE '%' || 'Mike' || '%'
-- GROUP BY b.isbn, b.title, b.author
-- ORDER BY avg_rating DESC NULLS LAST;