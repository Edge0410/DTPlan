function fetchPlans(route) {
  return new Promise(resolve => {
      setTimeout(() => {
          $("#counter").html("");
          $.ajax({
              url: route,
              type: "GET",
              dataType: "json",
              success: function (res) {
                  let container = document.getElementsByClassName("container-plans")[0];
                  console.log(res.records.length);//1
                  for(let i=0; i<res.records.length; i++){
                      let planChild = document.createElement('div');
                      planChild.classList.add("plan-data");
                      let childTitle = document.createElement('h3');
                      childTitle.classList.add("plan-title");
                      let childDesc = document.createElement('span');
                      childDesc.classList.add("plan-desc");
                      let childButton = document.createElement('a');
                      childButton.classList.add("plan-button");
                      childTitle.innerHTML = res.records[i].name;
                      childDesc.innerHTML = res.records[i].description;
                      childButton.innerHTML = "Go to plan";
                      childButton.href = "#";
                      planChild.appendChild(childTitle);
                      planChild.appendChild(childDesc);
                      planChild.appendChild(childButton);
                      container.appendChild(planChild);
                  }
                  if(res.records.length > 3)
                  {
                  buttonleft.style.display = "block";
                  buttonright.style.display = "block";
                  container.style.justifyContent = "initial";
                    }
              },
          });
          resolve('updated plan list');
      }, 100);
  });
}


function fetchPlanContent(route) {
    return new Promise(resolve => {
        setTimeout(() => {
            $("#counter").html("");
            $.ajax({
                url: route,
                type: "GET",
                dataType: "json",
                success: function (res) {
                    let container = document.getElementsByClassName("container")[0];
                    console.log(res.records.length);//1
                    if(res.type == 0){ // diet plan
                        for(let i=0; i<res.records.length; i++){
                            let planChild = document.createElement('div');
                            planChild.classList.add("diet-data");
                            let childTitle = document.createElement('h3');
                            childTitle.classList.add("diet-title");
                            let childDesc = document.createElement('span');
                            childDesc.classList.add("diet-desc");
                            childTitle.innerHTML = res.records[i].title;
                            childDesc.innerHTML = res.records[i].calories + " calorii";
                            planChild.appendChild(childTitle);
                            planChild.appendChild(childDesc);
                            container.appendChild(planChild);
                        }
                    }
                    else
                    {
                        for(let i=0; i<res.records.length; i++){
                            let planChild = document.createElement('div');
                            planChild.classList.add("workout-data");
                            let childTitle = document.createElement('h3');
                            childTitle.classList.add("diet-title");
                            let childDesc = document.createElement('span');
                            childDesc.classList.add("diet-desc");
                            childTitle.innerHTML = res.records[i].title;
                            childDesc.innerHTML = "Nivel de dificultate: " + res.records[i].difficulty;
                            planChild.appendChild(childTitle);
                            planChild.appendChild(childDesc);
                            container.appendChild(planChild);
                        }
                    }  
                    
                },
            });
            resolve('updated plan list');
        }, 100);
    });
  }

  function removeValidation() {
    // remove the "required" attribute from the input and textarea elements
        document.getElementById("name").removeAttribute("required");
        document.getElementById("description").removeAttribute("required");
        }
