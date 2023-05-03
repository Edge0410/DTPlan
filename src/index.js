const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors')
const session = require('express-session');

var database = require('./database');

app = express();
app.set("view engine", "ejs"); 

app.use("/assets", express.static(__dirname+"/assets"));

app.use(cors());

app.use(express.urlencoded({extended:true})); // creeaza req.body pentru formular ca sa nu mai fie in url parametrii din post

app.use(session({ secret: 'abcdefg', resave: true, saveUninitialized: false})); // req.session

app.get(["/", "/index"], function(req, res) {
        console.log(req.session.userid);
        res.render("pages/index", {id:req.session.userid, user:req.session.user, found:req.session.found});
        if(req.session.found == -1) {
            req.session.found = 0;
            req.session.save();
        }
});

app.get("/logout", function(req,res){
    req.session.destroy();
    res.redirect("/index");
});

app.get("/fetch-wplans", function (req, res) {
    query = `
    SELECT * FROM workout_plans where user_id = "${req.session.userid}"
    `

    database.query(query, function(err, resq){
        if (err){
            res.json({
                msg: error,
                records: 0,
              })
        }
        else
        {
            res.json({
                msg: 'Data successfully fetched',
                records: resq,
              })
        }
    });
});

app.get("/fetch-dplans", function (req, res) {
    query = `
    SELECT * FROM diet_plans where user_id = "${req.session.userid}"
    `

    database.query(query, function(err, resq){
        if (err){
            res.json({
                msg: error,
                records: 0,
              })
        }
        else
        {
            res.json({
                msg: 'Data successfully fetched',
                records: resq,
              })
        }
    });
});

app.get("/create-plan", function(req, res){
    res.render("pages"+req.url, {id:req.session.userid, user:req.session.user, found:req.session.found}, function(err, rezrand){
        if(err){
            res.render("pages/error404", {id:req.session.userid, user:req.session.user, found:req.session.found}); 
        }
        else if(!req.session.user)
        {
            res.redirect("/login"); 
        }
        else
        {
            res.send(rezrand);
        }
    });
});

app.get("/*", function(req, res){
    res.render("pages"+req.url, {id:req.session.userid, user:req.session.user, found:req.session.found}, function(err, rezrand){
        if(err){
            res.render("pages/error404", {id:req.session.userid, user:req.session.user, found:req.session.found}); 
        }
        else
        {
            res.send(rezrand);
        }
    });
});

/*
app.get(["/login"], function(req, res){
    res.render("pages/login");
});

app.get(["/register"], function(req, res){
    res.render("pages/register");
});
*/

app.post("/login", function(req, res){
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
                console.log(resq[0].id);
                req.session.userid = resq[0].id;
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

app.post("/complete-register",function(req,res){
    console.log(req.body);
    var weight = req.body.weight;
    var height = req.body.height;
    var gender = req.body.gender;
    var intgender;
    if(gender == "male")
        intgender = 1;
    else
        intgender = 0;
    query = `UPDATE users 
    set weight = ${weight}, height = ${height}, gender = ${intgender}
    where id = ${req.session.userid}`

    database.query(query, function(err, resq){
        if (err) throw err;
        console.log(resq.affectedRows);
    });

    res.redirect("/index");
})

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

    query2 = `
    SELECT * FROM users
    where username = "${user}"
    `;

    database.query(query2, function(err, resq){
                req.session.user = user;
                console.log(resq[0].id);
                req.session.userid = resq[0].id;
                req.session.found = 1; 
                res.redirect("/complete-register");          
    })
});

app.listen(8888); 
console.log("Running...");
