const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');

app = express();
app.set("view engine", "ejs"); 

app.use("/assets", express.static(__dirname+"/assets"));
app.use(express.urlencoded({extended:true})); // creeaza req.body pentru formular ca sa nu mai fie in url parametrii din post

app.use(session({ secret: 'abcdefg', resave: true, saveUninitialized: false})); // req.session

app.get(["/", "/index"], function(req, res){
    res.render("../index", {user:req.session.user, found:req.session.found});
    if(req.session.found == -1)
    {
        req.session.found = 0;
        req.session.save();
        
    }
});




app.listen(8888); 
console.log("Running...");