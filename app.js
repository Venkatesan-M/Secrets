//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const password = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const findOrCreate = require("mongoose-findorcreate");
// const encrypt = require("mongoose-encryption");
// `const md5 = require('md5');`

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb+srv://Venkatesan:Venka@cluster0.zcxvzob.mongodb.net/Secret'); 

const UserSchema = new mongoose.Schema({
    Email: String,
    Password: String,
    googleId: String,
    secret: String,
});

// UserSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["Password"]});
UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);
const User = mongoose.model("User", UserSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {

    findUsergot(User, user).then((foundUser)=>{
        // console.log(foundUser);
    })

    done(null, user);
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"    
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


async function findUser(User,username){
    const foundUser = await User.findOne({Email: username});
    return foundUser;
}
async function findAllSecrets(User) {
    try {
        const foundUsers = await User.find({ secret: { $ne: null } });
        return foundUsers;
    } catch (err) {
        throw err;
    }
}

async function findUsergot(User,id){
    const got = await User.findById(id);
    return got;
}

app.get("/",(req,res)=>{
    res.render('home');
})
app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}))
app.get("/auth/google/secrets", passport.authenticate("google", {failureRedirect: "/login"}), (req,res)=>{
    res.redirect("/secrets");
})
app.get("/login",(req,res)=>{
    res.render('login');
})
app.get("/register",(req,res)=>{
    res.render('register');
})

// app.post("/register",(req,res)=>{
//     const newUser = new User({Email: req.body.username, Password: md5(req.body.password)})
//     newUser.save();
//     res.render("secrets")
// })
// app.post("/login",(req,res)=>{
//     const username = req.body.username;
//     const password = md5(req.body.password);

//     findUser(User, username).then((foundUser)=>{
//         if(foundUser.Password===password){
//             res.render("secrets")
//         }else{
//             res.redirect("/");
//         }

//     })
// })

// app.get("/secrets", (req, res)=>{
//     if(req.isAuthenticated()){
//         res.render("secrets");
//     }else{
//         res.redirect("/login");
//     }
// })
app.get("/secrets", async (req, res) => {
    try {
        const foundUsers = await findAllSecrets(User);
        console.log(foundUsers);
        res.render("secrets", { userWithSecrets: foundUsers });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/logout",(req,res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})
app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post("/register",(req,res)=>{
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if(err){
            console.error(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets");
            })
        }
    })

})
app.post("/login",(req,res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, (err)=>{
        if(err){
            console.error(err)
        }else{
            passport.authenticate("local")(req, res, ()=>{
                res.redirect("/secrets")
            })
        }
    })
})

app.post("/submit",(req,res)=>{
    const submittedSecret = req.body.secret;
    console.log(submittedSecret);
    console.log(req.user._id);
    
    findUsergot(User, req.user._id).then((foundUser)=>{
        foundUser.secret = submittedSecret;
        foundUser.save().then(()=>{
            res.redirect("/secrets");
        })
    })
})





app.listen(3000, ()=>{
    console.log("Server Started!");
})