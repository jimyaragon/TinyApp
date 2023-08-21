const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080
const cookieSession = require("cookie-session");
const helpers = require("./helpers"); // Require the helpers.js module

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    id: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    id: "9sm5xK",
    longURL: "http://www.google.com"
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["your-secret-key"], // Add a secret key or array of keys for encryption
  maxAge: 24 * 60 * 60 * 1000 // Set the session to expire after 24 hours
}));

app.use((req, res, next) => {
  res.locals.user = users[req.session.user_id];
  next();
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const templateVars = {
      user: user
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/urls_login");
  }
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  const userURLs = getUserURLs(req.session.user_id);
  
  const templateVars = {
    user: user,
    urls: userURLs
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/:id", (req, res) => {
  const user = res.locals.user;
  const url = urlDatabase[req.params.id];

  if (!user) {
    const errorMessage = "You must be logged in to access this page.";
    return res.status(401).render("urls_error", { errorMessage });
  }

  if (!url) {
    const errorMessage = "Short URL not found.";
    return res.status(404).render("urls_error", { errorMessage });
  }

  if (url.userID !== user.id) {
    const errorMessage = "You do not own this URL.";
    return res.status(403).render("urls_error", { errorMessage });
  }

  const templateVars = { url, id: req.params.id };
  console.log(templateVars)
  res.render("urls_show", templateVars);
});



app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  const longUrlObject = urlDatabase[shortURL];

  if (longUrlObject && longUrlObject.longURL) {
    res.redirect(longUrlObject.longURL);
  } else {
    const errorMessage = "Short URL not found";
    const templateVars = {
      user: res.locals.user,
      errorMessage: errorMessage
    };
    res.status(404).render("urls_login", templateVars);
  }
});

app.get("/urls_login", (req, res) => {
  if (res.locals.user) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: null // or set to a default value
    };
    res.render("urls_login", templateVars);
  }
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


app.get("/urls_register", (req, res) => {
  if (res.locals.user) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: null // or set to a default value
    };
    res.render("urls_register", templateVars);
  }
});


app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send("Email and password are required. Try again!");
    return;
  }

  if (helpers.getUserByEmail(email, users)) { // Use the function from helpers.js
    res.status(400).send("Email is already registered.");
    return;
  }

  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10); // Hash the password
  users[userId] = {
    id: userId,
    email: email,
    password: hashedPassword, // Save the hashed password
  };

  req.session.user_id = userId; // Set the user_id in session
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: user.id
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("You must be logged in to shorten URLs.");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;
  const user = res.locals.user;

  if (!user) {
    const errorMessage = "You must be logged in to perform this action.";
    return res.status(401).render("urls_error", { errorMessage });
  }

  if (urlDatabase[idToDelete]) {
    if (urlDatabase[idToDelete].userID === user.id) {
      delete urlDatabase[idToDelete];
      res.redirect("/urls");
    } else {
      const errorMessage = "You do not own this URL.";
      res.status(403).render("urls_error", { errorMessage });
    }
  } else {
    const errorMessage = "Short URL not found";
    res.status(404).render("urls_error", { errorMessage });
  }
});


app.post("/urls/:id", (req, res) => {
  const idToUpdate = req.params.id;
  const user = res.locals.user;

  if (!user) {
    const errorMessage = "You must be logged in to perform this action.";
    return res.status(401).render("error", { errorMessage });
  }

  const newLongURL = req.body.longURL;

  if (urlDatabase[idToUpdate]) {
    if (urlDatabase[idToUpdate].userID === user.id) {
      urlDatabase[idToUpdate].longURL = newLongURL;
      res.redirect("/urls");
    } else {
      const errorMessage = "You do not own this URL.";
      res.status(403).render("error", { errorMessage });
    }
  } else {
    const errorMessage = "Short URL not found";
    res.status(404).render("error", { errorMessage });
  }
});


app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = helpers.getUserByEmail(email, users);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid email or password.");
  } else {
    req.session.user_id = user.id; // Set the user_id in session
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  // Clear the user_id cookie
  res.clearCookie("user_id");

  // Redirect to the login page
  res.redirect("/urls_login");
});

function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}


function generateRandomString() {
  const length = 6;
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

//retrieve URLs belonging to a specific user//

function getUserURLs(userID) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}

//Function to retrieve URLs where userID is equal to id//
function getURLsForUser(id) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

  