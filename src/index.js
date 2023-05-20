const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors')
const session = require('express-session');
const url = require('url');

var database = require('./database');
const { parse } = require('path');

app = express();
app.set("view engine", "ejs");

app.use("/assets", express.static(__dirname + "/assets"));

app.use(cors());

app.use(express.urlencoded({ extended: true })); // creeaza req.body pentru formular ca sa nu mai fie in url parametrii din post

app.use(session({ secret: 'abcdefg', resave: true, saveUninitialized: false })); // req.session

app.get(["/", "/index"], function (req, res) {
    console.log(req.session.userid);
    res.render("pages/index", { id: req.session.userid, user: req.session.user, found: req.session.found, page: "dashboard" });
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
    res.render("pages" + url.parse(req.url).pathname, { id: req.session.userid, user: req.session.user, found: req.session.found, page: "diet-plans" }, function (err, rezrand) {
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
    res.render("pages" + url.parse(req.url).pathname, { id: req.session.userid, user: req.session.user, found: req.session.found, page: "workout-plans" }, function (err, rezrand) {
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
                res.render("pages/login", { response: "wrong_password" });
            }
        }
        else {
            req.session.found = -1;
            res.render("pages/login", { response: "username_not_found" });
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

app.post("/create-plan", async function (req, res) {
    console.log(req.body);
    
    var ptype = req.body.ptype;
    var height = req.body.height;
    var weight = req.body.weight;
    var age = req.body.age;
    var routine = req.body.routine;
    var goal = req.body.goal;
    console.log("id:" + req.session.userid);
    var gender = await new Promise((resolve, reject) => {
        const query = "SELECT gender from users where id = " + req.session.userid;
        database.query(query, function (err, res) {
          if (err) reject(err);
          else resolve(res[0].gender);
        });
      });
    
    console.log("Gender: " + gender);
    var inserted_id;

    //age = 1 - age;
    //Height in m:
    height = height / 100;
    let BMI = weight / (height * height);
    console.log("BMI: " + BMI);
    //Transform age and gender into int:
    let BFI = 1.2 * BMI + 0.23 * age - 10.8 * gender - 5.4;
    console.log("BFI: " + BFI);            
    // Underweight: BMI < 18.5
    // Normal weight: 18.5 ≤ BMI < 24.9
    // Overweight: 25 ≤ BMI < 29.9
    // Obese: BMI ≥ 30

    // Essential Fat:
    // Men: 2-5%
    // Women: 10-13%

    // Athletes:
    // Men: 6-13%
    // Women: 14-20%

    // Fit:
    // Men: 14-17%
    // Women: 21-24%

    // Acceptable:
    // Men: 18-24%
    // Women: 25-31%

    // Overweight/Obese:
    // Men: 25% and above
    // Women: 32% and above
                
    let optimum_BMI = 20;
    //Optim pt baieti: 15, optim pt fete: 22
    let optimum_BFI = gender === 1 ? 15 : 22;
                

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
                let diff_BMI = Math.abs(BMI - optimum_BMI);
                let diff_BFI = Math.abs(BFI - optimum_BFI);
                let BMR;
                if(gender == 1) //height in cm and age in years
                    BMR = 66.5 + (13.75 * weight) + (5.003 * height * 100) - (6.755 * age);
                else
                    BMR = 655.1 + (9.563 * weight) + (1.850 * height * 100) - (4.676 * age);
                console.log("BMR: " + BMR);
               
                let caloric_intake;
                switch (routine) {
                    case '3': // Active
                        caloric_intake = BMR * 1.725;
                        break;
                    case '2': // Mild Active
                        caloric_intake = BMR * 1.55;
                        break;
                    case '1': // Mild Sedentary
                        caloric_intake = BMR * 1.375;
                        break;
                    case '0': // Sedentary
                        caloric_intake = BMR * 1.2;
                        break;
                }
                caloric_intake = Math.round(caloric_intake);
                console.log("Caloric intake: " + caloric_intake);
                query = `INSERT INTO diet_meals VALUES (${inserted_id}, 1), (${inserted_id}, 2), (${inserted_id}, 3)`;

                /* algoritm */

                const getMeals = () => {
                    return new Promise((resolve, reject) => {
                        const query = "SELECT * from meals";
                        database.query(query, function (err, res) {
                            if (err) reject(err);
                            else resolve(res);
                          });
                        });
                      };

                
                getMeals().then(meals => {
                        const convenient_meals = meals.filter(meal => meal.calories <= caloric_intake);
                        var n = convenient_meals.length;
                        var table = Array.from(Array(n + 1), () => Array(caloric_intake + 1).fill(0));
                        const selectedFoods = [];
                        //selected_type = "cardio"
                        
                        if(goal == 0)
                        {
                            //scadem caloriile
                            caloric_intake -= 0.10 * caloric_intake;
                    
                        }
                        else{
                            //modificam caloriile
                            caloric_intake += 0.15 * caloric_intake;
                        }
                        caloric_intake = Math.round(caloric_intake);
                        console.log("Caloric intake: " + caloric_intake);
                        for (let i = 1; i <= n; i++) {
                            const food = convenient_meals[i - 1];
                            for (let j = 1; j <= caloric_intake; j++) {
                              if (food.calories <= j) {
                                const newValue = food.calories + table[i - 1][j - food.calories];
                                if (newValue > table[i - 1][j]) {
                                  table[i][j] = newValue;
                                  selectedFoods[j] = [food].concat(selectedFoods[j - food.calories]);
                                } else {
                                  table[i][j] = table[i - 1][j];
                                  selectedFoods[j] = selectedFoods[j] || selectedFoods[j - 1];
                                }
                              } else {
                                table[i][j] = table[i - 1][j];
                                selectedFoods[j] = selectedFoods[j] || selectedFoods[j - 1];
                              }
                            }
                          }
                          var sum = 0;
                          for(var i = 0; i < selectedFoods[caloric_intake].length - 1; i++)
                          {
                            console.log(selectedFoods[caloric_intake][i].title);
                            sum += selectedFoods[caloric_intake][i].calories;
                          }
                          console.log("Total calories: " + sum);
                          
                        //Inseram mealurile in baza de date:
                        query = "INSERT INTO diet_meals VALUES ";
                        for(var meal of selectedFoods[caloric_intake].slice(0, -1))
                        {
                            query += `(${inserted_id}, ${meal.id}), `;
                        }
                        query = query.substring(0, query.length - 2);
                        query += ";";
                        //query = `INSERT INTO workout_exercises VALUES (${inserted_id}, 1), (${inserted_id}, 2), (${inserted_id}, 3)`;

                        /* algoritm */
            
                        database.query(query, function (err, resq) {
                        if (err) throw err;
                        else {
                            res.redirect("/complete-create-plan");
                        }
                        });
                    })
            }
        });
    }
    else
    {
        console.log("Workout");
        queryCreatePlan = `INSERT INTO workout_plans (name, description, user_id) values ("", "", ${req.session.userid})`;
        database.query(queryCreatePlan, await function (err, resq) {
            if (err) {
                throw err;
            } else {
                inserted_id = resq.insertId;
                req.session.insertId = inserted_id;
                req.session.planType = ptype;
                console.log(inserted_id);
                /* algoritm */
                
                let diff_BMI = Math.abs(BMI - optimum_BMI);
                let diff_BFI = Math.abs(BFI - optimum_BFI);

                let target_score_cardio = target_score_muscle = (5 * (diff_BMI + diff_BFI)) / 2;
                console.log("Target score cardio: " + target_score_cardio);
                console.log("Target score muscle: " + target_score_muscle);
                if(goal == 0) //slabire
                {
                    target_score_muscle /= 2;
                    console.log("Cardio");
                }
                else{
                    target_score_cardio /= 2;
                    console.log("Muscle");
                }

                let max_intensity_score;
                switch(routine)
                {
                    case '3': // Active
                    max_intensity_score = 10;
                    break;
                  case '2': // Mild Active
                    max_intensity_score = 9;
                    break;
                  case '1': // Mild Sedentary
                    max_intensity_score = 7;
                    break;
                  case '0': // Sedentary
                    max_intensity_score = 5;
                    break;
                }    
                console.log(max_intensity_score);
                console.log("BMI: " + BMI);
                console.log("BFI: " + BFI);

                //Array-ul de exercitii
                const getExercices = () => {
                    return new Promise((resolve, reject) => {
                        const query = "SELECT * from exercises";
                        database.query(query, function (err, res) {
                            if (err) reject(err);
                            else resolve(res);
                          });
                        });
                      };

                
                getExercices().then(exercises => {
                        const muscle_exercises = exercises.filter((ex) => ex.index_resistance <= max_intensity_score).sort((a, b) => b.index_resistance - a.index_resistance);
                        const cardio_exercises = exercises.filter((ex) => ex.index_cardio <= max_intensity_score).sort((a, b) => b.index_cardio - a.index_cardio);
                        
                        var n;
                        var dp;
                        //selected_type = "cardio"
                        target_score_cardio = Math.floor(target_score_cardio * 10);
                        target_score_muscle = Math.floor(target_score_muscle * 10);
                        
                        if(goal == 0)
                        {
                            n = cardio_exercises.length;
                            const results = {};
                            results[0] = {exercices: [], sum : 0};

                            for(const ex of cardio_exercises)
                            {
                                for(let i = target_score_cardio; i >= ex.index_cardio; i--)
                                {
                                    if(results[i - ex.index_cardio] != null)
                                    {
                                        const sum = results[i - ex.index_cardio].sum + ex.index_cardio;
                                        if(results[i] == null || results[i].sum < sum)
                                        {
                                            results[i] = {exercices: [...results[i - ex.index_cardio].exercices, ex], sum};
                                        }
                                    }
                                }
                            }

                            for(ex of results[target_score_cardio].exercices)
                            {
                                console.log(ex.title);
                                console.log(ex.index_cardio);
                                console.log(ex.index_resistance);
                            }

                            //Inseram exercitiile in baza de date:
                            query = "INSERT INTO workout_exercises VALUES ";
                            for(ex of results[target_score_cardio].exercices)
                            {
                                query += `(${inserted_id}, ${ex.id}), `;
                            }
                            query = query.substring(0, query.length - 2);
                            query += ";";
                            //query = `INSERT INTO workout_exercises VALUES (${inserted_id}, 1), (${inserted_id}, 2), (${inserted_id}, 3)`;
                
                            /* algoritm */
                
                            database.query(query, function (err, resq) {
                            if (err) throw err;
                            else {
                                res.redirect("/complete-create-plan");
                            }
                            });
                        }
                        //selected_type = "muscle"
                        else{

                            n = muscle_exercises.length;
                            const results = {};
                            results[0] = {exercices: [], sum : 0};

                            for(const ex of muscle_exercises)
                            {
                                for(let i = target_score_muscle; i >= ex.index_resistance; i--)
                                {
                                    if(results[i - ex.index_resistance] != null)
                                    {
                                        const sum = results[i - ex.index_resistance].sum + ex.index_resistance;
                                        if(results[i] == null || results[i].sum < sum)
                                        {
                                            results[i] = {exercices: [...results[i - ex.index_resistance].exercices, ex], sum};
                                        }
                                    }
                                }
                            }

                            for(ex of results[target_score_muscle].exercices)
                            {
                                console.log(ex.title);
                                console.log(ex.index_cardio);
                                console.log(ex.index_resistance);
                            }

                            //Inseram exercitiile in baza de date:
                            query = "INSERT INTO workout_exercises VALUES ";
                            for(ex of results[target_score_muscle].exercices)
                            {
                                query += `(${inserted_id}, ${ex.id}), `;
                            }
                            query = query.substring(0, query.length - 2);
                            query += ";";
                            //query = `INSERT INTO workout_exercises VALUES (${inserted_id}, 1), (${inserted_id}, 2), (${inserted_id}, 3)`;
                
                            /* algoritm */
                
                            database.query(query, function (err, resq) {
                            if (err) throw err;
                            else {
                                res.redirect("/complete-create-plan");
                            }
                            });

                        }
                      }).catch(err => {
                        console.error(err);
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
