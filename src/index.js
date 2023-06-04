const express = require('express');
const fs = require('fs');
const crypto = require('crypto');
const cors = require('cors')
const session = require('express-session');
const url = require('url');
const moment = require('moment/moment');

var database = require('./database');
const { parse } = require('path');

app = express();
app.set("view engine", "ejs");

app.use("/assets", express.static(__dirname + "/assets"));

app.use(cors());

app.use(express.urlencoded({ extended: true })); // creeaza req.body pentru formular ca sa nu mai fie in url parametrii din post

app.use(session({ secret: 'abcdefg', resave: true, saveUninitialized: false })); // req.session

function diff_years(dateStr) {
    var date = new Date(dateStr);
    var diff = (Date.now() - date.getTime()) / 1000;
    diff /= (60 * 60 * 24);
    return Math.abs(Math.round(diff / 365.25));
}

app.get(["/", "/index"], function (req, res) {
    console.log(req.session.userid);

    if (req.session.found === 1) {
        console.log("logged in, fetching user details");
        console.log("user id follows:");
        console.log(req.session.userid);

        query = `SELECT * FROM users WHERE id = "${req.session.userid}"`;

        database.query(query, function (err, resq) {
            if (err) {
                console.log("error fetching");
            }
            else {
                console.log("fetch succesful")
                // console.log(resq[0]);
            }

            var age = diff_years(resq[0].birth_date);

            var user_data = {
                height: resq[0].height,
                weight: resq[0].weight,
                gender: resq[0].gender,
                birth_date: resq[0].birth_date,
                age: age,
                goal: resq[0].goal,
                weight_goal: resq[0].weight_goal
            };

            // if (user_data.height == null || user_data.weight == null || user_data.gender == null || user_data.birth_date == null) 
            //     res.redirect("/complete-register");

            res.render("pages/index", { id: req.session.userid, user: req.session.user, found: req.session.found, user_data: user_data, page: "dashboard" });
        });
    }
    else {
        res.render("pages/index", { id: req.session.userid, user: req.session.user, found: req.session.found, page: "dashboard" });
    }

    if (req.session.found == -1) {
        req.session.found = 0;
        req.session.save();
    }
});

app.get("/update-details", function (req, res) {
    if (req.session.found === 1) {
        console.log("logged in, fetching user details");
        console.log("user id follows:");
        console.log(req.session.userid);

        query = `SELECT * FROM users WHERE id = "${req.session.userid}"`;

        database.query(query, function (err, resq) {
            if (err) {
                console.log("error fetching");
            }
            else {
                console.log("fetch succesful")
                // console.log(resq[0]);
            }

            var user_data = {
                height: resq[0].height,
                weight: resq[0].weight,
                gender: resq[0].gender,
                birth_date: moment(resq[0].birth_date).format("YYYY-MM-DD")
            };

            // if (user_data.height == null || user_data.weight == null || user_data.gender == null || user_data.birth_date == null) 
            //     res.redirect("/complete-register");

            // res.render("pages/update-details", { id: req.session.userid, user: req.session.user, found: req.session.found, user_height: resq[0].height, user_weight: resq[0].weight, user_gender: resq[0].gender, page: "details" });
            res.render("pages/update-details", { id: req.session.userid, user: req.session.user, found: req.session.found, user_data: user_data, page: "details" });
        });
    }
    else {
        res.redirect("/login");
    }
});

app.get("/update-goals", function (req, res) {
    if (req.session.found === 1) {
        console.log("logged in, fetching user details");
        console.log("user id follows:");
        console.log(req.session.userid);

        query = `SELECT * FROM users WHERE id = "${req.session.userid}"`;

        database.query(query, function (err, resq) {
            if (err) {
                console.log("error fetching");
            }
            else {
                console.log("fetch succesful")
                // console.log(resq[0]);
            }

            var user_data = {
                goal: resq[0].goal,
                weight_goal: resq[0].weight_goal
            };

            // if (user_data.height == null || user_data.weight == null || user_data.gender == null || user_data.birth_date == null) 
            //     res.redirect("/complete-register");

            // res.render("pages/update-details", { id: req.session.userid, user: req.session.user, found: req.session.found, user_height: resq[0].height, user_weight: resq[0].weight, user_gender: resq[0].gender, page: "details" });
            res.render("pages/update-goals", { id: req.session.userid, user: req.session.user, found: req.session.found, user_data: user_data, page: "goals" });
        });
    }
    else {
        res.redirect("/login");
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

app.get("/view-diet-plan", function (req, res) {
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
            database.query(query, function (err, resq) {
                if (err || resq.length == 0) {
                    res.redirect("/error404");
                }
                else {
                    if (resq[0].user_id == req.session.userid) {
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
    //req.session.plancacheid = null;
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

app.get("/view-workout-plan", function (req, res) {
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
            database.query(query, function (err, resq) {
                if (err || resq.length == 0) {
                    res.redirect("/error404");
                }
                else {
                    if (resq[0].user_id == req.session.userid) {
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
    //req.session.plancacheid = null;
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

app.get(["/create-diet-plan", "/create-workout-plan"], function (req, res) {
    res.set('Cache-Control', 'no-store, no-cache');
    if (req.session.found === 1) {
        console.log("logged in, fetching user details");
        console.log("user id follows:");
        console.log(req.session.userid);

        query = `SELECT * FROM users WHERE id = "${req.session.userid}"`;

        database.query(query, function (err, resq) {
            if (err) {
                console.log("error fetching");
            }
            else {
                console.log("fetch succesful")
                // console.log(resq[0]);
            }

            var user_data = {
                height: resq[0].height,
                weight: resq[0].weight,
                gender: resq[0].gender,
                birth_date: resq[0].birth_date,
                activity_level: resq[0].activity_level,
                goal: resq[0].goal
            };

            res.render("pages" + req.url, { id: req.session.userid, user: req.session.user, found: req.session.found, user_data: user_data }, function (err, rezrand) {
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
    }
    else {
        res.redirect("/login");
    }
});

app.get("/diet-plans", function (req, res) {
    if (req.session.found === 1) {
        res.set('Cache-Control', 'no-store, no-cache');
        res.render("pages" + req.url, { id: req.session.userid, user: req.session.user, found: req.session.found, plancacheid: req.session.insertId, plancachetype: req.session.planType, page: "diet-plans" }, function (err, rezrand) {
            if (err) {
                res.render("pages/error404", { id: req.session.userid, user: req.session.user, found: req.session.found });
            }
            else {
                res.send(rezrand);
            }
        });
    }
    else {
        res.redirect("/login");
    }
});

app.get("/workout-plans", function (req, res) {
    if (req.session.found === 1) {
        res.set('Cache-Control', 'no-store, no-cache');
        res.render("pages" + req.url, { id: req.session.userid, user: req.session.user, found: req.session.found, plancacheid: req.session.insertId, plancachetype: req.session.planType, page: "workout-plans" }, function (err, rezrand) {
            if (err) {
                res.render("pages/error404", { id: req.session.userid, user: req.session.user, found: req.session.found });
            }
            else {
                res.send(rezrand);
            }
        });
    }
    else {
        res.redirect("/login");
    }
});

app.get("/*", function (req, res) {
    res.set('Cache-Control', 'no-store, no-cache');
    res.render("pages" + req.url, { id: req.session.userid, user: req.session.user, found: req.session.found, plancacheid: req.session.insertId, plancachetype: req.session.planType }, function (err, rezrand) {
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

app.post("/save-updated-details", function (req, res) {
    var username = req.body.username;
    var height = req.body.height;
    var weight = req.body.weight;
    var gender = req.body.gender;
    var birth_date = new String(req.body.birthday);

    var intgender;
    if (gender == "male")
        intgender = 1;
    else
        intgender = 0;

    query = `UPDATE users 
    set username = "${username}", weight = ${weight}, height = ${height}, gender = ${intgender}, birth_date = STR_TO_DATE('${birth_date}', '%Y-%m-%d')
    where id = ${req.session.userid};`

    database.query(query, function (err, resq) {
        if (err) throw err;
        console.log(resq.affectedRows);
    });

    res.redirect("/index");
});

app.post("/save-updated-goals", function (req, res) {
    var goal = req.body.goal;
    var weight_goal = req.body.weight_goal;

    var intgoal;
    if (goal == "weight")
        intgoal = 0;
    else
        intgoal = 1;

    query = `UPDATE users 
    set goal = "${intgoal}", weight_goal = ${weight_goal}
    where id = ${req.session.userid};`

    database.query(query, function (err, resq) {
        if (err) throw err;
        console.log(resq.affectedRows);
    });

    res.redirect("/index");
});

app.post("/complete-register", function (req, res) {
    console.log(req.body);
    var weight = req.body.weight;
    var height = req.body.height;
    var gender = req.body.gender;
    var birth_date = new String(req.body.birthday);
    console.log(birth_date);
    var intgender;
    var activity_level = req.body.activity_level;
    var goal = req.body.goal;
    var weight_goal = req.body.weight_goal;

    if (gender == "male")
        intgender = 1;
    else
        intgender = 0;

    var intgoal;
    if (goal == "weight")
        intgoal = 0;
    else
        intgoal = 1;

    query = `UPDATE users 
    set weight = ${weight}, height = ${height}, gender = ${intgender}, birth_date = STR_TO_DATE('${birth_date}', '%Y-%m-%d'), activity_level = "${activity_level}", goal = "${intgoal}", weight_goal = ${weight_goal}
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

    query_check = `
    SELECT * FROM users
    where username = "${user}"
    `;

    database.query(query_check, function (err, resq) {
        if (err) throw err;
        if (resq.length > 0) {
            console.log("username taken error");
            // res.redirect("/index");
            // res.render("pages/register", { response: "username_taken" });
        }
    });

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
    // var age = req.body.age;
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
    var birth_date = await new Promise((resolve, reject) => {
        const query = "SELECT birth_date from users where id = " + req.session.userid;
        database.query(query, function (err, res) {
            if (err) reject(err);
            else resolve(res[0].birth_date);
        });
    });
    console.log("Birthday: " + birth_date);

    var age = diff_years(birth_date);
    
    console.log("Age (calculated): " + age);

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
                if (gender == 1) //height in cm and age in years
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
                //query = `INSERT INTO diet_meals VALUES (${inserted_id}, 1), (${inserted_id}, 2), (${inserted_id}, 3)`;

                /* algoritm */

                function shuffleArray(array) {
                    for (let i = array.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [array[i], array[j]] = [array[j], array[i]];
                    }
                    return array;
                  }


                const getMeals = (category) => {
                    return new Promise((resolve, reject) => {
                        const query = "SELECT * FROM MEALS WHERE type =" + category;
                        database.query(query, function (err, res) {
                            if(err) reject(err);
                            else resolve(res);
                        });
                    });
                };
                        });
                    });
                };

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

                const getSnacks = getMeals(0);
                const getBreakfast = getMeals(1);
                const getLunches = getMeals(2);
                const getDinners = getMeals(3);
                const mealPlans = [];
                Promise.all([getSnacks, getBreakfast, getLunches, getDinners]).then(
                    ([snacks, breakfasts, lunches, dinners]) => {
                        //if the number of total calories is under 2000 kcal we won't have any snack
                        
                        const selectMeals = (mealList, calorieLimit, numMeals) => {
                            // Sort the meals by closest calories to the target
                            mealList.sort((a, b) => Math.abs(a.calories - calorieLimit) - Math.abs(b.calories - calorieLimit));
                          
                            // Select the specified number of meals that are closest to the calorie limit
                            return mealList.slice(0, numMeals);
                          };
  

                        if(caloric_intake < 2000)
                        {
                            console.log("Caloric intake less than 2000");
                            const breakfastCalories = Math.round(caloric_intake * 0.3);
                            const lunchCalories = Math.round(caloric_intake * 0.4);
                            const dinnerCalories = Math.round(caloric_intake * 0.3);

                            const selectedBreakfasts = selectMeals(breakfasts, breakfastCalories, 7);
                            const selectedLunches = selectMeals(lunches, lunchCalories, 7);
                            const selectedDinners = selectMeals(dinners, dinnerCalories, 7);

                            shuffleArray(selectedBreakfasts);
                            shuffleArray(selectedLunches);
                            shuffleArray(selectedDinners);

                            
                            for (let i = 0; i < 7; i++) {
                                const mealPlan = {
                                    day: i + 1,
                                    breakfast: selectedBreakfasts[i],
                                    lunch: selectedLunches[i],
                                    dinner: selectedDinners[i]
                                };
                            mealPlans.push(mealPlan);
                            }

                            console.log(mealPlans);
                        
                            //Parcurgem mealurile:
                            for(var day of mealPlans)
                            {
                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.breakfast.id}), `;
                                query = query.substring(0, query.length - 2) + ";";

                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });
                        
                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.lunch.id}), `;
                                query = query.substring(0, query.length - 2) + ";";
                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });

                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.dinner.id}), `;
                                query = query.substring(0, query.length - 2) + ";";
                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });
                            }
                            res.redirect("/complete-create-plan");
                        }   
                        
                        //if the number of total calories is between 2000 and 2500 kcal we'll have 1 snack
                        else if(caloric_intake < 2500)
                        {
                            console.log("Caloric intake between 2000 and 2500kcal");
                            const breakfastCalories = Math.round(caloric_intake * 0.3);
                            const snackCalories = Math.round(caloric_intake * 0.1)
                            const lunchCalories = Math.round(caloric_intake * 0.3);
                            const dinnerCalories = Math.round(caloric_intake * 0.3);

                            const selectedBreakfasts = selectMeals(breakfasts, breakfastCalories, 7);
                            const selectedSnacks = selectMeals(snacks, snackCalories, 7);
                            const selectedLunches = selectMeals(lunches, lunchCalories, 7);
                            const selectedDinners = selectMeals(dinners, dinnerCalories, 7);
                            shuffleArray(selectedBreakfasts);
                            shuffleArray(selectedSnacks);
                            shuffleArray(selectedLunches);
                            shuffleArray(selectedDinners);

                            for (let i = 0; i < 7; i++) {
                                const mealPlan = {
                                    day: i + 1,
                                    breakfast: selectedBreakfasts[i],
                                    snack: selectedSnacks[i],
                                    lunch: selectedLunches[i],
                                    dinner: selectedDinners[i]
                                };
                            mealPlans.push(mealPlan);
                            }

                            console.log(mealPlans);

                            for(var day of mealPlans)
                            {
                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.breakfast.id}), `;
                                query = query.substring(0, query.length - 2) + ";";

                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });

                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.snack.id}), `;
                                query = query.substring(0, query.length - 2) + ";";

                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });    

                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.lunch.id}), `;
                                query = query.substring(0, query.length - 2) + ";";
                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });

                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.dinner.id}), `;
                                query = query.substring(0, query.length - 2) + ";";
                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });
                            }
                            res.redirect("/complete-create-plan");

                        }
                        else{

                            console.log("Caloric intake between 2000 and 2500kcal");
                            const breakfastCalories = Math.round(caloric_intake * 0.3);
                            const snackCalories = Math.round(caloric_intake * 0.05)
                            const lunchCalories = Math.round(caloric_intake * 0.3);
                            const dinnerCalories = Math.round(caloric_intake * 0.3);

                            const selectedBreakfasts = selectMeals(breakfasts, breakfastCalories, 7);
                            const selectedSnacks = selectMeals(snacks, snackCalories, 14);
                            const selectedLunches = selectMeals(lunches, lunchCalories, 7);
                            const selectedDinners = selectMeals(dinners, dinnerCalories, 7);
                            shuffleArray(selectedBreakfasts);
                            shuffleArray(selectedSnacks);
                            shuffleArray(selectedLunches);
                            shuffleArray(selectedDinners);

                            for (let i = 0; i < 7; i++) {
                                const mealPlan = {
                                    day: i + 1,
                                    breakfast: selectedBreakfasts[i],
                                    snack1: selectedSnacks[i],
                                    lunch: selectedLunches[i],
                                    dinner: selectedDinners[i],
                                    snack2: selectedSnacks[i + 7]
                                };
                            mealPlans.push(mealPlan);
                            }

                            console.log(mealPlans);

                            for(var day of mealPlans)
                            {
                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.breakfast.id}), `;
                                query = query.substring(0, query.length - 2) + ";";

                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });

                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.snack1.id}), `;
                                query = query.substring(0, query.length - 2) + ";";

                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });    

                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.lunch.id}), `;
                                query = query.substring(0, query.length - 2) + ";";
                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });

                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.dinner.id}), `;
                                query = query.substring(0, query.length - 2) + ";";
                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });

                                query = "INSERT INTO diet_meals VALUES ";
                                query += `(${inserted_id}, ${day.snack2.id}), `;
                                query = query.substring(0, query.length - 2) + ";";
                                database.query(query, function (err, resq) {
                                if (err) throw err;
                                });
                            }
                            res.redirect("/complete-create-plan");
                        }
                    }
                )
            }
        });
    }
    else {
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
                if (goal == 0) //slabire
                {
                    target_score_muscle /= 2;
                    console.log("Cardio");
                }
                else {
                    target_score_cardio /= 2;
                    console.log("Muscle");
                }

                let max_intensity_score;
                switch (routine) {
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
                        const sumIndexCardio = cardio_exercises.reduce((sum, ex) => sum + ex.index_cardio, 0);
                        console.log('Sum of index_cardio:', sumIndexCardio);
                        target_score_cardio = Math.floor(target_score_cardio * 10);
                        target_score_muscle = Math.floor(target_score_muscle * 10);
                        console.log("Target score cardio: ")
                        console.log(target_score_cardio)
                        //selected_type = "cardio"
                        if(goal == 0)
                        {
                            n = cardio_exercises.length;
                            const results = {};
                            results[0] = {exercices: [], sum : 0};

                        for (const ex of cardio_exercises) {
                            for (let i = target_score_cardio; i >= ex.index_cardio; i--) {
                                if (results[i - ex.index_cardio] != null) {
                                    const sum = results[i - ex.index_cardio].sum + ex.index_cardio;
                                    if (results[i] == null || results[i].sum < sum) {
                                        results[i] = { exercices: [...results[i - ex.index_cardio].exercices, ex], sum };
                                    }
                                }
                            }
                        }

                        for (ex of results[target_score_cardio].exercices) {
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
                            /* algoritm */
                
                            database.query(query, function (err, resq) {
                            if (err) throw err;
                            else {
                                res.redirect("/complete-create-plan");
                            }
                        });
                    }
                    //selected_type = "muscle"
                    else {

                        n = muscle_exercises.length;
                        const results = {};
                        results[0] = { exercices: [], sum: 0 };

                        for (const ex of muscle_exercises) {
                            for (let i = target_score_muscle; i >= ex.index_resistance; i--) {
                                if (results[i - ex.index_resistance] != null) {
                                    const sum = results[i - ex.index_resistance].sum + ex.index_resistance;
                                    if (results[i] == null || results[i].sum < sum) {
                                        results[i] = { exercices: [...results[i - ex.index_resistance].exercices, ex], sum };
                                    }
                                }
                            }
                        }

                        for (ex of results[target_score_muscle].exercices) {
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

app.post("/update-created-plan", function (req, res) {
    console.log(req.body);
    var name = req.body.name;
    var desc = req.body.description;
    var action = req.body.submit;
    if (action == 0) { //delete plan
        if (req.session.planType == 0) {
            query = `DELETE from diet_meals where id_diet = ${req.session.insertId}`;
            database.query(query, function (err, resq) {
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
        else {
            query = `DELETE from workout_exercises where id_workout = ${req.session.insertId}`;
            database.query(query, function (err, resq) {
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
    else { // update name & desc
        if (req.session.planType == 0) {
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
        else {
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

app.post("/manage-diet-plan", function (req, res) {
    var action = req.body.submit;
    if (action == 0) { // delete plan
        query = `DELETE from diet_meals where id_diet = ${req.session.plancacheid}`;
        database.query(query, function (err, resq) {
            if (err) {
                throw err;
            } else {
                query = `DELETE from diet_plans where id = ${req.session.plancacheid}`;
                database.query(query, function (err, resq) {
                    if (err) throw err;
                    else {
                        console.log("deleted plan " + req.session.plancacheid);
                        res.redirect("/diet-plans");
                    }
                });
            }
        })
    }
});

app.post("/manage-workout-plan", function (req, res) {
    var action = req.body.submit;
    if (action == 0) { // delete plan
        query = `DELETE from workout_exercises where id_workout = ${req.session.plancacheid}`;
        database.query(query, function (err, resq) {
            if (err) {
                throw err;
            } else {
                query = `DELETE from workout_plans where id = ${req.session.plancacheid}`;
                database.query(query, function (err, resq) {
                    if (err) throw err;
                    else {
                        console.log("deleted plan " + req.session.plancacheid);
                        res.redirect("/workout-plans");
                    }
                });
            }
        })
    }
});


app.listen(8888);
console.log("Running...");
