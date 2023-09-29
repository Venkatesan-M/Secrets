//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect('mongodb+srv://Venkatesan:Venka@cluster0.zcxvzob.mongodb.net/Secret'); 

const UserSchema = new mongoose.Schema({
    Email: String,
    Password: String
});

UserSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["Password"]});

const User = mongoose.model("User", UserSchema);

async function findUser(User,username){
    const foundUser = await User.findOne({Email: username});
    return foundUser;
  }

const app = express();

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

app.set('view engine', 'ejs');


app.get("/",(req,res)=>{
    res.render('home');
})
app.get("/login",(req,res)=>{
    res.render('login');
})
app.get("/register",(req,res)=>{
    res.render('register');
})

app.post("/register",(req,res)=>{
    const newUser = new User({Email: req.body.username, Password: req.body.password})
    newUser.save();
    res.render("secrets")
})
app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    findUser(User, username).then((foundUser)=>{
        if(foundUser.Password===password){
            res.render("secrets")
        }else{
            res.redirect("/");
        }

    })
})






app.listen(3000, ()=>{
    console.log("Server Started!");
})