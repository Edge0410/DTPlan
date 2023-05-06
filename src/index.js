const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors')
const session = require('express-session');
const url = require('url');

var database = require('./database');

app = express();
app.set("view engine", "ejs");

app.use("/assets", express.static(__dirname + "/assets"));

app.use(cors());

app.use(express.urlencoded({ extended: true })); // creeaza req.body pentru formular ca sa nu mai fie in url parametrii din post

app.use(session({ secret: 'abcdefg', resave: true, saveUninitialized: false })); // req.session

app.get(["/", "/index"], function (req, res) {
    console.log(req.session.userid);
    res.render("pages/index", { id: req.session.userid, user: req.session.user, found: req.session.found });
    if (req.session.found == -1) {
        req.session.found = 0;
        req.session.save();
    }
});

app.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/index");
});

app.get("/fetch-wplans", function (req, res) {
    query = `
    SELECT * FROM workout_plans where user_id = "${req.session.userid}"
    `

    database.query(query, function (err, resq) {
        if (err) {
            res.json({
                msg: err,
                records: 0,
            })
        }
        else {
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

    database.query(query, function (err, resq) {
        if (err) {
            res.json({
                msg: err,
                records: 0,
            })
        }
        else {
            res.json({
                msg: 'Data successfully fetched',
                records: resq,
            })
        }
    });
});

app.get("/view-diet-plan", function(req, res){
    let plan_id = req.query.id;
    res.set('Cache-Control', 'no-store, no-cache');
    res.render("pages" + url.parse(req.url).pathname, { id: req.session.userid, user: req.session.user, found: req.session.found }, function (err, rezrand) {
        if (err) {
            res.render("pages/error404", { id: req.session.userid, user: req.session.user, found: req.session.found });
        }
        else if (!req.session.user) {
            res.redirect("/login");
        }
        else { // trebuie sa verific daca planul inclus in query string imi apartine ca sa nu pot accesa orice plan
            query = `SELECT user_id from diet_plans where id = ${plan_id}`;
            database.query(query, function(err, resq){
                if(err || resq.length == 0){
                    res.redirect("/error404");
                }
                else
                {
                    if(resq[0].user_id == req.session.userid){
                        req.session.plancacheid = plan_id;
                        console.log("id: " + req.session.plancacheid);
                        res.send(rezrand);
                    }
                    else
                        res.redirect("/error404");
                }
            })
        }
    });
});

app.get("/view-diet-plan/data", function (req, res) {
    let plan_id = req.session.plancacheid;
    console.log("id: " + plan_id);
    query = `
    SELECT * FROM diet_plans dp join diet_meals dm on dp.id = dm.id_diet join meals m on dm.id_meals = m.id where dp.id = "${plan_id}"
    `
    req.session.plancacheid = null;
    database.query(query, function (err, resq) {
        if (err) {
            res.json({
                msg: err,
                type: undefined,
                records: 0,
            })
        }
        else {
            res.json({
                msg: 'Data successfully fetched',
                type: 0,
                records: resq,
            })
        }
    });
});

app.get("/view-workout-plan", function(req, res){
    let plan_id = req.query.id;
    res.set('Cache-Control', 'no-store, no-cache');
    res.render("pages" + url.parse(req.url).pathname, { id: req.session.userid, user: req.session.user, found: req.session.found }, function (err, rezrand) {
        if (err) {
            console.log(err);
            res.render("pages/error404", { id: req.session.userid, user: req.session.user, found: req.session.found });
        }
        else if (!req.session.user) {
            res.redirect("/login");
        }
        else { // trebuie sa verific daca planul inclus in query string imi apartine ca sa nu pot accesa orice plan
            query = `SELECT user_id from workout_plans where id = ${plan_id}`;
            database.query(query, function(err, resq){
                if(err || resq.length == 0){
                    res.redirect("/error404");
                }
                else
                {
                    if(resq[0].user_id == req.session.userid){
                        req.session.plancacheid = plan_id;
                        console.log("id: " + req.session.plancacheid);
                        res.send(rezrand);
                    }
                    else
                        res.redirect("/error404");
                }
            })
        }
    });
});

app.get("/view-workout-plan/data", function (req, res) {
    let plan_id = req.session.plancacheid;
    console.log("id: " + plan_id);
    query = `
    SELECT * FROM workout_plans dp join workout_exercises dm on dp.id = dm.id_workout join exercises m on dm.id_exercises = m.id where dp.id = "${plan_id}"
    `
    req.session.plancacheid = null;
    database.query(query, function (err, resq) {
        if (err) {
            res.json({
                msg: err,
                type: undefined,
                records: 0,
            })
        }
        else {
            res.json({
                msg: 'Data successfully fetched',
                type: 1,
                records: resq,
            })
        }
    });
});

app.get("/fetch-cache-plan", function (req, res) {
    let planType = req.session.planType;
    let query;
    console.log(req.session.insertId);
    console.log(req.session.planType);

    if (planType == 0) {
        query = `
        SELECT * FROM diet_plans dp join diet_meals dm on dp.id = dm.id_diet join meals m on dm.id_meals = m.id where dp.id = "${req.session.insertId}"`;
    }
    else {
        query = `
        SELECT * FROM workout_plans dp join workout_exercises dm on dp.id = dm.id_workout join exercises m on dm.id_exercises = m.id where dp.id = "${req.session.insertId}"`;
    }

    //req.session.insertId = null; 
    // se scoate daca vrem sa ne ramana ultimul plan in cache toata sesiunea
    database.query(query, function (err, resq) {
        if (err) {
            res.json({
                msg: err,
                type: undefined,
                records: 0,
            })
        }
        else {
            res.json({
                msg: '',
                type: planType,
                records: resq,
            })
        }
    });
});

app.get(["/create-plan", "/complete-create-plan"], function (req, res) {
    res.set('Cache-Control', 'no-store, no-cache');
    res.render("pages" + req.url, { id: req.session.userid, user: req.session.user, found: req.session.found }, function (err, rezrand) {
        if (err) {
            res.render("pages/error404", { id: req.session.userid, user: req.session.user, found: req.session.found });
        }
        else if (!req.session.user) {
            res.redirect("/login");
        }
        else {
            res.send(rezrand);
        }
    });
});


app.get("/*", function (req, res) {
    res.set('Cache-Control', 'no-store, no-cache');
    res.render("pages" + req.url, { id: req.session.userid, user: req.session.user, found: req.session.found, plancacheid: req.session.insertId, plancachetype: req.session.planType}, function (err, rezrand) {
        if (err) {
            res.render("pages/error404", { id: req.session.userid, user: req.session.user, found: req.session.found });
        }
        else {
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

app.post("/login", function (req, res) {
    console.log(req.body);
    var user = req.body.username;
    var password = crypto.scryptSync(req.body.password, "iewhrg3yYYDAjert377999", 32).toString('hex');
    console.log(password);

    query = `
    SELECT * FROM users
    where username = "${user}"
    `;

    database.query(query, function (err, resq) {
        if (resq.length > 0) {
            if (resq[0].password == password) {
                req.session.user = user;
                console.log(resq[0].id);
                req.session.userid = resq[0].id;
                req.session.found = 1;
                res.redirect("/index");
            }
            else {
                req.session.found = -1;
                res.redirect("/index");
            }
        }
        else {
            req.session.found = -1;
            res.redirect("/index");
        }
    });

    console.log(req.session.user);
});

app.post("/complete-register", function (req, res) {
    console.log(req.body);
    var weight = req.body.weight;
    var height = req.body.height;
    var gender = req.body.gender;
    var birth_date = new String(req.body.birthday);
    console.log(birth_date);
    var intgender;
    if (gender == "male")
        intgender = 1;
    else
        intgender = 0;


    query = `UPDATE users 
    set weight = ${weight}, height = ${height}, gender = ${intgender}, birth_date = STR_TO_DATE('${birth_date}', '%Y-%m-%d')
    where id = ${req.session.userid};`

    database.query(query, function (err, resq) {
        if (err) throw err;
        console.log(resq.affectedRows);
    });

    res.redirect("/index");
})

app.post("/register", function (req, res) {
    console.log(req.body);
    var user = req.body.username;
    var email = req.body.email;
    var encpass = crypto.scryptSync(req.body.password, "iewhrg3yYYDAjert377999", 32).toString('hex');

    query = `
    INSERT INTO users (username, email, password)
    values ("${user}", "${email}", "${encpass}")
    `;

    database.query(query, function (err, resq) {
        if (err) throw err;
        console.log(resq.affectedRows);
    });

    query2 = `
    SELECT * FROM users
    where username = "${user}"
    `;

    database.query(query2, function (err, resq) {
        req.session.user = user;
        console.log(resq[0].id);
        req.session.userid = resq[0].id;
        req.session.found = 1;
        res.redirect("/complete-register");
    })
});

app.post("/create-plan", function (req, res) {
    console.log(req.body);
    var ptype = req.body.ptype;
    var height = req.body.height;
    var weight = req.body.weight;
    var age = req.body.age;
    var routine = req.body.routine;
    var goal = req.body.goal;
    var inserted_id;

    if (ptype == 0) { // avem diet plan
        queryCreatePlan = `INSERT INTO diet_plans (name, description, user_id) values ("", "", ${req.session.userid})`;
        database.query(queryCreatePlan, function (err, resq) {
            if (err) {
                res.redirect("error404");
            } else {
                inserted_id = resq.insertId;
                req.session.insertId = inserted_id;
                req.session.planType = ptype;
                console.log(inserted_id);
                /* algoritm */

                query = `INSERT INTO diet_meals VALUES (${inserted_id}, 1), (${inserted_id}, 2), (${inserted_id}, 3)`;

                /* algoritm */

                database.query(query, function (err, resq) {
                    if (err) 
                        res.redirect("error404");
                    else {
                        res.redirect("/complete-create-plan");
                    }
                });
            }
        })
    }
    else
    {
        queryCreatePlan = `INSERT INTO workout_plans (name, description, user_id) values ("", "", ${req.session.userid})`;
        database.query(queryCreatePlan, function (err, resq) {
            if (err) {
                throw err;
            } else {
                inserted_id = resq.insertId;
                req.session.insertId = inserted_id;
                req.session.planType = ptype;
                console.log(inserted_id);
                /* algoritm */

                query = `INSERT INTO workout_exercises VALUES (${inserted_id}, 1), (${inserted_id}, 2), (${inserted_id}, 3)`;

                /* algoritm */
                
                database.query(query, function (err, resq) {
                    if (err) throw err;
                    else {
                        res.redirect("/complete-create-plan");
                    }
                });
            }
        })
    }
});

app.post("/update-created-plan", function(req, res){
    console.log(req.body);
    var name = req.body.name;
    var desc = req.body.description;
    var action = req.body.submit;
    if(action == 0){ //delete plan
        if(req.session.planType == 0)
        {
            query = `DELETE from diet_meals where id_diet = ${req.session.insertId}`;
            database.query(query, function(err, resq){
                if (err) {
                    throw err;
                } else {    
                    query = `DELETE from diet_plans where id = ${req.session.insertId}`;
                    database.query(query, function (err, resq) {
                        if (err) throw err;
                        else {
                            req.session.insertId = null;
                            req.session.planType = null;
                            res.redirect("/diet-plans");
                        }
                    });
                }
            })
        }
        else
        {
            query = `DELETE from workout_exercises where id_workout = ${req.session.insertId}`;
            database.query(query, function(err, resq){
                if (err) {
                    throw err;
                } else {  
                    query = `DELETE from workout_plans where id = ${req.session.insertId}`;
                    database.query(query, function (err, resq) {
                        if (err) throw err;
                        else {
                            req.session.insertId = null;
                            req.session.planType = null;  
                            res.redirect("/workout-plans");
                        }
                    });
                }
            })
        }
    }
    else{ // update name & desc
        if(req.session.planType == 0)
        {
            query = `UPDATE diet_plans set name = "${name}", description = "${desc}" where id = ${req.session.insertId}`;
            database.query(query, function (err, resq) {
                if (err) throw err;
                else {
                    req.session.insertId = null;
                    req.session.planType = null;
                    res.redirect("/diet-plans");
                }
            });
        }
        else
        {
            query = `UPDATE workout_plans set name = "${name}", description = "${desc}" where id = ${req.session.insertId}`;
            database.query(query, function (err, resq) {
                if (err) throw err;
                else {
                    req.session.insertId = null;
                    req.session.planType = null;
                    res.redirect("/workout-plans");
                }
            });
        }
    }
});



app.listen(8888);
console.log("Running...");
