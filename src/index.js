const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');

var database = require('./database');

app = express();
app.set("view engine", "ejs"); 

app.use("/assets", express.static(__dirname+"/assets"));

app.use(express.urlencoded({extended:true})); // creeaza req.body pentru formular ca sa nu mai fie in url parametrii din post

app.use(session({ secret: 'abcdefg', resave: true, saveUninitialized: false})); // req.session

app.get(["/", "/index"], function(req, res) {
    res.render("pages/index", {user:req.session.user, found:req.session.found});
    if(req.session.found == -1) {
        req.session.found = 0;
        req.session.save();
    }
});

app.get(["/login"], function(req, res){
    res.render("pages/login");
});

app.get(["/register"], function(req, res){
    res.render("pages/register");
});

app.post(["/login"], function(req, res){
    console.log(req.body);
    var user = req.body.username;
    var password = crypto.scryptSync(req.body.password, "iewhrg3yYYDAjert377999", 32).toString('hex');
    console.log(password);

    query = `
    SELECT * FROM users
    where username = "${user}"
    `;

    database.query(query, function(err, resq){
        if(resq.length > 0)
        {
            if(resq[0].password == password)
            {
                req.session.user = user;
                req.session.found = 1;
                res.redirect("/index");
            }
            else
            {
                req.session.found = -1;
                res.redirect("/index");
            }
        }
        else
        {
                req.session.found = -1;
                res.redirect("/index");
        }
    });

    console.log(req.session.user);

});

app.post("/register", function(req, res){
    console.log(req.body);
    var user = req.body.username;
    var email = req.body.email;
    var encpass = crypto.scryptSync(req.body.password, "iewhrg3yYYDAjert377999", 32).toString('hex');

    query = `
    INSERT INTO users (username, email, password)
    values ("${user}", "${email}", "${encpass}")
    `;

    database.query(query, function(err, resq){
        if (err) throw err;
        console.log(resq.affectedRows);
    });
    res.redirect("/index");

});

app.listen(8888); 
console.log("Running...");
