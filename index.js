require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const passport = require("passport");
const flash = require('express-flash');
const session = require('express-session');
const path = require("path");
const User = require("./models/User");

const bcrypt = require("bcryptjs");
const{
  checkAuthenticated,
  checkNotAuthenticated
}= require("./middlewares/auth");
const PORT = process.env.PORT || 3000;
const app = express();
const initializePassport = require('./passport-config');
initializePassport(
  passport,
  async(email)=>{
    const userFound = await User.findOne({ email})
    return userFound
  },
  async (id)=>{
    const userFound = await User.findOne({_id: id})
    return userFound;
  }
)

const ejs = require("ejs");
// const req = require("express/lib/request");
app.set("view engine", "ejs");


app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
})
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(express.static(__dirname + "/public"));

app.get("/",checkAuthenticated, (req, res) => {
  res.render("home",{name: req.user.name});
});

// app.get("/", checkNotAuthenticated, (req, res) => {
//   res.render("home", {name: req.user.name});
// });

// app.get("/login", checkAuthenticated , (req, res) => {
//   res.render("login", {name: req.user.name});
// });

app.get("/register",checkNotAuthenticated, (req,res)=>{
  res.render("register");

});

 

app.get("/login", checkNotAuthenticated, (req,res)=>{
    res.render("login");

});

app.get("/menu", (req, res) => {
  res.render("menu");
});


app.post('/login', checkNotAuthenticated, passport.authenticate('local',{
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash:true,
})
);

app.post('/register', checkNotAuthenticated,async(req,res)=>{
  const userFound = await User.findOne({email: req.body.email});

  if(userFound){
    req.flash('error', 'User with that email already exists')
    res.redirect('/register');
  } else{
    try {
      const hashedPassword = await bcrypt.hash(req.body.password,10)
      const user = new User({
        name:  req.body.name,
        email:  req.body.email,
        password: hashedPassword,
      });
      await user.save();
      res.redirect("/login");
    } catch(error){
      console.log(error);
      res.redirect("/register");
    }
  }
});

app.delete('/logout', (req,res)=>{
  req.logout();
  res.redirect('/login');
})


// Establishing connection
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/food-ordering');
}


app.listen(PORT, function () {
    console.log("server is running");
  });