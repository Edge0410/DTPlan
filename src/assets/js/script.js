function fetchPlans(route) {
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
              },
          });
          resolve('updated plan list');
      }, 100);
  });
}