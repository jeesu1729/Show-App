if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const kaam = require("./faltu");
const express = require("express");
const app = express();
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./model/user");
const Myshow = require("./model/myshow");
const Tvshow = require("./model/tvshows");
const fetch = require("node-fetch");
const flash = require("connect-flash");
const { isloggedin } = require("./middleware");
const MongoDBStore = require('connect-mongo');
const dbUrl = process.env.db_url || "mongodb://localhost:27017/show";
const secret = process.env.SECRET ||  "somesecret";

const baseURL = "https://api.themoviedb.org/3/";
//"mongodb://localhost:27017/show"
mongoose.connect( dbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
  console.log("connneeeeeee");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const store = new MongoDBStore({
  mongoUrl: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60
})

store.on("error", function (e){
  console.log("ll",e);
})

const sessionConfig = {
  store,
  name: "blah",
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    //  secure : true,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.currentuser = req.user;
  next();
});

app.get("/", (req, res) => {
  //console.log(process.env.api_key);
  res.render("home");
});

app.get("/myallshow", isloggedin, async (req, res) => {
  const myshow = await Myshow.findOne({ username: req.user.username }).populate(
    "shows.show_detail"
  );
  const result = myshow.shows;
  console.log(myshow.info);
  res.render("myallshow", { result });
});

app.get("/series/:id", isloggedin, async (req, res) => {
  const id = req.params.id;
  const url = baseURL.concat(
    "tv/",
    id,
    "?api_key=",
    process.env.api_key,
    "&language=en-US"
  );
  let resulte = await fetch(url)
    .then((result) => result.json())
    .catch(() => {
      console.log("error");
    });
  console.log(resulte);
  const myshow = await Myshow.findOne({ username: req.user.username });
  let val = -1;
  for (let i = 0; i < myshow.shows.length; i++) {
    if (myshow.shows[i].showid == id) {
      val = i;
      break;
    }
  }
  //let resulte = kaam;
  let yours = null;
  if (val != -1) {
    yours = myshow.shows[val].info;
  }
  res.render("show", { resulte, yours });
});

app.post("/series/:id", async (req, res) => {
  const infoe = req.body.info;
  const id = req.params.id;

  const tvobject = req.body.totalinfo;
  let tvshow = await Tvshow.findOne({ showid: id });
  if (tvshow != null) {
    tvshow.last_season = tvobject.last_season;
    tvshow.last_episode = tvobject.last_episode;
    tvshow.save();
  } else {
    tvshow = new Tvshow(tvobject);
    await tvshow.save();
  }
  const object = {
    show_detail: tvshow,
    showid: req.params.id,
    info: infoe,
  };
  const myshow = await Myshow.findOne({ username: req.user.username });
  let val = -1;
  for (let i = 0; i < myshow.shows.length; i++) {
    if (myshow.shows[i].showid == id) {
      val = i;
      break;
    }
  }
  if (val != -1) {
    myshow.shows[val].info = infoe;
  } else {
    myshow.shows.push(object);
  }
  await myshow.save();
  console.log(tvobject, "jj");
  res.redirect("/myallshow");
});

app.get("/search", (req, res) => {
  let resulte;
  res.render("search", { resulte });
});

app.post("/search", async (req, res) => {
  const { query } = req.body;
  const url = baseURL.concat(
    "search/tv?api_key=",
    process.env.api_key,
    "&language=en-US&page=1&query=",
    query,
    "&include_adult=true"
  );
  let resulte = await fetch(url)
    .then((result) => result.json())
    .catch((err) => {
      console.log(err, "error");
    });
  //console.log(resulte);
  res.render("search", { resulte });
});

app.get("/register", (req, res) => {
  res.render("user/register");
});

app.get("/login", (req, res) => {
  res.render("user/login");
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/register" }),
  async (req, res, next) => {
    res.redirect("/");
  }
);

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.post("/register", async (req, res, next) => {
  const { username, password } = req.body.user;
  const user = new User({ username });
  const registeruser = await User.register(user, password);

  req.login(registeruser, (err) => {
    if (err) {
      console.log(err);
    }
  });
  const shows = [];
  const myshow = new Myshow({ username, shows });
  console.log(myshow, "jj");
  await myshow.save();
  res.redirect("/");
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("yo");
});
