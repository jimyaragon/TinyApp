const express = require("express");
const app = express();
const PORT = 8080; // default port 8080;

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
  });

  app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
  });

  app.get("/urls", (req, res) => {
    const templateVars = { urls: urlDatabase };
    res.render("urls_index", templateVars);
  });

  app.get("/urls/new", (req, res) => {
    res.render("urls_new");
  });
  
  app.get("/urls/:id", (req, res) => {
    const templateVars = { id: req.params.id, longURL: "http://www.lighthouselabs.ca"};
    res.render("urls_show", templateVars);
  });

  app.post("/urls", (req, res) => {
    const randomId = generateRandomString();
    urlDatabase[randomId] = req.body.longURL; // Save the new id-longURL pair
    res.redirect(`/urls/${randomId}`); // Redirect to the new URL
  });

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

  app.get("/u/:id", (req, res) => {
    const longURL = urlDatabase[req.params.id];
    if (longURL) {
      res.redirect(longURL);
    } else {
      res.status(404).send("Short URL not found");
    }
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