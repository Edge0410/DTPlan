var mySwiper = new Swiper('.container', {
  slidesPerView : 'auto',
  centeredSlides : true,
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