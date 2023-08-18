const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
app.use(cookieParser());

app.use((req, res, next) => {
  res.locals.user = users[req.cookies.user_id];
  next();
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    user: user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = {
    user: user,
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
});

app.get("/urls_login", (req, res) => {
  const templateVars = {
    user: null // or set to a default value
  };
  res.render("urls_login", templateVars);
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
  const templateVars = {
    user: null // or set to a default value
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send("Please add Email and password");
    return;
  }

  if (getUserByEmail(email)) {
    res.status(400).send("This email address is already in the system");
    return;
  }

  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: password
  };

  res.cookie("user_id", userId);
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  const id = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[id] = longURL;
  res.redirect(`/urls/${id}`); // Redirect to the newly created URL
});

app.post("/urls/:id/delete", (req, res) => {
  const idToDelete = req.params.id;

  if (urlDatabase[idToDelete]) {
    delete urlDatabase[idToDelete];
    res.redirect("/urls");
  } else {
    res.status(404).send("Short URL not found");
  }
});

app.post("/urls/:id", (req, res) => {
  const idToUpdate = req.params.id;
  const newLongURL = req.body.longURL;

  if (urlDatabase[idToUpdate]) {
    urlDatabase[idToUpdate] = newLongURL;
    res.redirect("/urls");
  } else {
    res.status(404).send("Short URL not found");
  }
});



app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the user exists and the password matches
  const user = getUserByEmail(email);
  if (user && user.password === password) {
    // Set the user_id as a cookie
    res.cookie("user_id", user.id);

    // Redirect back to the /urls page
    res.redirect("/urls");
  } else {
    res.status(400).send("Please review. Your email or password is incorrect");
  }
});

app.post("/logout", (req, res) => {
  // Clear the user_id cookie
  res.clearCookie("user_id");

  // Redirect back to the /urls page
  res.redirect("/urls");
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

  