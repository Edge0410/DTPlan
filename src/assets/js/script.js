function fetchPlans(route, swiper_index) {
    return new Promise(resolve => {
        setTimeout(() => {
            $("#counter").html("");
            $.ajax({
                url: route,
                type: "GET",
                dataType: "json",
                success: function (res) {
                    let container = document.getElementsByClassName("swiper-container")[swiper_index];
                    let swiperWrapper = document.getElementsByClassName("swiper-wrapper")[swiper_index];
                    console.log(res.records.length);//1
                    for (let i = 0; i < res.records.length; i++) {
                        let planChild = document.createElement('div');
                        if (route.includes("dplans"))
                            planChild.classList.add("plan-data");
                        else
                            planChild.classList.add("plan-data-workout");
                        planChild.classList.add("swiper-slide");
                        let childTitle = document.createElement('h2');
                        childTitle.classList.add("plan-title");
                        let childDesc = document.createElement('span');
                        childDesc.classList.add("plan-desc");
                        let childButton = document.createElement('a');
                        childButton.classList.add("plan-button");
                        childTitle.innerHTML = res.records[i].name;
                        childDesc.innerHTML = res.records[i].description;
                        childButton.innerHTML = "Details";
                        if (route.includes("dplans"))
                            childButton.href = "view-diet-plan?id=" + res.records[i].id;
                        else
                            childButton.href = "view-workout-plan?id=" + res.records[i].id;
                        planChild.appendChild(childTitle);
                        planChild.appendChild(childDesc);
                        planChild.appendChild(childButton);
                        swiperWrapper.appendChild(planChild);
                    }

                    var mySwiper = new Swiper('.swiper-container', {
                        slidesPerView: 'auto',
                        centeredSlides: true,
                        longSwipes: false,
                        effect: "coverflow",
                        grabCursor: true,
                        centeredSlides: true,
                        coverflowEffect: {
                            rotate: 0,
                            stretch: 0,
                            depth: 100,
                            modifier: 3,
                            slideShadows: false
                        },
                        pagination: {
                            el: ".swiper-pagination",
                            clickable: true
                        },
                        // breakpoints: {
                        //   640: {
                        //     slidesPerView: 2
                        //   },
                        //   768: {
                        //     slidesPerView: 1
                        //   },
                        //   1024: {
                        //     slidesPerView: 2
                        //   },
                        //   1560: {
                        //     slidesPerView: 3
                        //   }
                        // },
                        pagination: {
                            el: '.swiper-pagination',
                            clickable: true,
                        },
                        navigation: {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev',
                        },
                    });
                },
            });
            resolve('updated plan list');
        }, 100);
    });
}

function fetchPlansList(route) {

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
                    if (res.type == 0) { // diet plan
                        let step = res.records.length / 7; // 5
                        for (let i = 0; i < res.records.length; i++) {
                            if(i % step == 0){
                                let childTit = document.createElement('h3');
                                childTit.innerHTML = "Ziua " + (i/step + 1);
                                container.appendChild(childTit);
                            }
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
                    else {
                        for (let i = 0; i < res.records.length; i++) {
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
