import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import LocomotiveScroll from "/node_modules/locomotive-scroll";
import lottie from "lottie-web";
import animationData from "../img/Birds.json";

gsap.registerPlugin(ScrollTrigger, SplitText);

// ------------------------------------------------------------------- CONFIG
const CONFIG = {
  // Phones and tablets (<=900px) get the mobile layout in mobileStyle.css
  isMobile: window.matchMedia("(max-width: 900px)").matches,
  mobileNav: window.matchMedia("(max-width: 900px)"),
  scrollLerp: 0.1,
  scrollMultiplier: 1,
  touchMultiplier: 5,
  slideSwitchDelay: 900,
  birdDelay: 1600,
  birdDuration: 10000,
  headerDescDelay: 1800,
  openingTimelineDuration: 1.2,
  navigatorDelay: 1800,
};

// ------------------------------------------------------------------- DOM elements
const container = document.querySelector(".scroll-container");
const slides = document.querySelectorAll(".slide");
const birdsEl = document.getElementById("birds");
const headerBackground = document.querySelector(".header_background");
const headerDesc = document.querySelector(".header-desc");
const headerTitle = document.querySelector(".logo-product");
const navigator = document.querySelector("#navigation");
const productName =  window.location.pathname.replaceAll('/','').replaceAll('.html' , '');

// ------------------------------------------------------------------- State
let animateSection = false;
let currentSlide = 0;
let locoScroll = null;
let birdAnimation = null;
let startY = 0;
let isScrollingToSection = false;
let windowHeight = window.innerHeight;
// ------------------------------------------------------------------- Locomotive Scroll init
function initLocomotive() {
  locoScroll = new LocomotiveScroll({
    el: container,
    smooth: !CONFIG.isMobile,
    lerp: CONFIG.scrollLerp,
    multiplier: CONFIG.scrollMultiplier,
    touchMultiplier: CONFIG.touchMultiplier,
    smartphone: { smooth: true, breakpoint: 767 },
    tablet: { smooth: true, breakpoint: 1024 },
  });

  ScrollTrigger.scrollerProxy(container, {
    scrollTop(value) {
      return arguments.length
        ? locoScroll.scrollTo(value, { duration: 0, disableLerp: true })
        : locoScroll.scroll.instance.scroll.y;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    pinType: getComputedStyle(container).transform !== "none" ? "transform" : "fixed",
  });

  locoScroll.on("scroll", ScrollTrigger.update);
  ScrollTrigger.config({ autoRefreshEvents: "DOMContentLoaded,load,resize" });
  ScrollTrigger.addEventListener("refresh", () => locoScroll.update());
  ScrollTrigger.refresh();
  ScrollTrigger.defaults({ scroller: container });

  locoScroll.start();
}

initLocomotive();

// ------------------------------------------------------------------- Slide animation
function handleWheel(e) {
  if (animateSection || isScrollingToSection) return;
  e.preventDefault();
  e.deltaY > 0 ? animate("down") : animate("up");
}

function handleTouchStart(e) {
  startY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
  if (animateSection || isScrollingToSection) return;
  const diff = startY - e.changedTouches[0].clientY;
  if (Math.abs(diff) < 40) return;
  diff > 0 ? animate("down") : animate("up");
}

function stopFrame() {
  if (isScrollingToSection) return;
  locoScroll.stop();
  document.addEventListener("wheel", handleWheel, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
  console.log("Stopped");
}

function startFrame() {
  locoScroll.start();
  document.removeEventListener("wheel", handleWheel);
  document.removeEventListener("touchend", handleTouchEnd);
  console.log("Start");
}

const dur = 0.3;
const del = 0;

function hideNav(){
  gsap.to('#navigation' , {opacity: 0 , top: -100 , ease: "none" , duration: dur , delay: del})
  gsap.to('.logo_float' , {top: 0 , ease: "none" , duration: dur , delay: del})
}
function showNav(){
  gsap.to('#navigation' , {opacity: 1 , top: 20 , ease: "none" , duration: dur , delay: del})
   gsap.to('.logo_float' , {top: -100 , ease: "none" , duration: dur , delay: del})
}


const features_length = document.querySelector('#content_scroll').children.length;
let steps_features = "";
for(let i = 0 ; i <  features_length ; i++){
   steps_features += `<div class="step_features step_features_${i+1}"></div>`
}
$('.steps-features-cont').append(steps_features)


let isScrolling = false;
let isProgrammaticScroll = false;


// Scroll function for other sections
function scrollTo(target, smooth , isOffset) {
  const element = document.querySelector(target);
  if (!element) return;

  let smoothTrue = smooth === true ? false : true;
  const currentScroll = locoScroll.scroll.instance.scroll.y;
  const targetScroll = element.offsetParent.offsetTop;
  let offset = currentScroll > targetScroll ? -20 : 20;

  if(isOffset){
    offset = 0
  }
   
  locoScroll.scrollTo(target, {
    offset: offset,
    duration: smoothTrue ? 0 : 300,
    disableLerp: smoothTrue,
  });
  
}





// Attach to navigation links
document.querySelectorAll('.scrollTo').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = link.getAttribute('scrollTo');
    const location = link.getAttribute('target');
    if (location === 'self') {
      if (target === '#showcase') {
        scrollTo(target, false, true);
      } else {
        scrollTo(target, false, false);
      }
    }
    if (location === 'home') {
      let type = ''
      switch (target[0]) {
        case '#':
          type = 'id'
          break;
        case '.':
          type = 'class'
          break;
      }
      let scrollEl = target.slice(1)
      window.location = `/?scrollTo=${scrollEl}&type=${type}`
    }
    if (CONFIG.mobileNav.matches) {
      menuToggle()
    }
  });
});


let overlap_1 = 0.5;
let start_1 = windowHeight - 1000;
let end_1 = windowHeight - 700;
let endSoon = windowHeight /  2 - 300;



// First pin (client section with delay)
let isPaused = false;



if (!CONFIG.isMobile) {

  let images = gsap.utils.toArray(".fetures_image");
  gsap.set(images, { x: 0, y: 300, scale: 0.5 });

  images.forEach((image, i) => {
    let startOffset = windowHeight * overlap_1;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#product-features",
        start: () => `top+=${i * windowHeight - start_1 - startOffset} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1} top`,
        scrub: 1,
        // markers: true
      }
    });

    tl.to(image, { y: 0, opacity: 1, scale: 1, ease: "none" })
      .to(image, { x: -500, opacity: 0, delay: 0.5, scale: 0.5, ease: "none" });
  });


  let features_text = gsap.utils.toArray(".features_text");
  gsap.set(features_text, { x: 700 });

  features_text.forEach((text, i) => {
    let startOffset = windowHeight * overlap_1;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#product-features",
        start: () => `top+=${i * windowHeight - start_1 - startOffset} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1} top`,
        scrub: 1,
        // markers: true
      }
    });

    tl.to(text, { x: 0, opacity: 1, ease: "none" })
      .to(text, { y: 300, opacity: 0, delay: 0.5, ease: "none" });

  });

} else {
  let card_features = gsap.utils.toArray(".card-features");
  card_features.forEach((card, i) => {
    let startOffset = windowHeight * 0.8;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#product-features",
        start: () => `top+=${i * windowHeight - start_1 - startOffset} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1} top`,
        scrub: 1,
        // markers: true
      }
    });
    tl.to(card, { left: '50%', opacity: 1, ease: "none" })
      .to(card, { left: '-150%', opacity: 0, delay: 0.5, ease: "none" });
  });
}

  let steps = gsap.utils.toArray(".step_features");
  steps.forEach((step, i) => {
    let startOffset = windowHeight * overlap_1;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#product-features",
        start: () => `top+=${i * windowHeight - start_1 - startOffset} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1} top`,
        scrub: 1,
        // markers: true
      }
    });
    tl.to(step, { background: "#D89A1D", ease: "none" })
      .to(step, { background: "#D89A1D00", delay: 0.5, ease: "none" })
  });





let features_title = gsap.utils.toArray(".product-title");
features_title.forEach((text, i) => {
  let startOffset = windowHeight * overlap_1;
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#product-features",
      start: () => `top+=${i * windowHeight - start_1 - startOffset} top`,
      end: () => `top+=${(i + 1) * windowHeight - end_1 } top`,
      scrub: 1,
      // markers: true
    }
  });
  tl.to(text, {  borderBottomColor: '#D89A1D' , color: '#ffffff', ease: "none" })
  .to(text, { borderBottomColor: '#d89a1d00', color: '#787878' , delay: 0.5, ease: "none" });
});


const multiplier = document.querySelector(".row-features").children.length - 0.5;

// ScrollTrigger to lock slides when entering section - FIXED
ScrollTrigger.create({
  trigger: "#product-features",
  start: "top top",
  pinSpacing: true,
  end: () => {
    const section = document.querySelector('#product-features');
    const contentHeight = section.scrollHeight * multiplier - endSoon;
    const triggerHeight = section.offsetHeight;
    const percentage = (contentHeight / triggerHeight) * 100;
    return `${percentage}%`;
  },
  pin: "#product-features",
  onEnter: () => { hideNav() ; gsap.to('.skip-features' , {bottom: 50 , ease: "none" , duration: 0.2 }) },
  onEnterBack: () => { hideNav()  ; gsap.to('.skip-features' , {bottom: 50 , ease: "none" , duration: 0.2 })},
  onLeave: () => { showNav()  ; gsap.to('.skip-features' , {bottom: -100 , ease: "none" , duration: 0.2 })},
  onLeaveBack: () => { showNav()  ; gsap.to('.skip-features' , {bottom: -100 , ease: "none" , duration: 0.2 })},
  // markers: true
});


const skipButton = document.querySelector('.skip-features')
skipButton.addEventListener('click' , ()=>{
  scrollTo('#showcase' , false , true);
})


// let step_prod = gsap.utils.toArray(".step_prod");

// step_prod.forEach((step, i) => {
//   let startOffset = windowHeight * overlap_1;
//   let tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: "#section_3",
//       start: () => `top+=${i * windowHeight - start_1 - startOffset - offsetProduct} top`,
//       end: () => `top+=${(i + 1) * windowHeight - end_1 - offsetProduct} top`,
//       scrub: 1
//       // markers: true
//     }
//   });
//   tl.to(step , { background: "#D89A1D" , ease: "none" })
//   .to(step , { background: "#D89A1D00" , delay: 0.5, ease: "none" })
// });



// let products = gsap.utils.toArray(".product-cont");
// gsap.set(products, { x: 700 , opacity:0 });

// let offsetProduct = 0;

// products.forEach((product, i) => {
//   let startOffset = windowHeight * overlap_1;
//   let tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: "#section_3",
//       start: () => `top+=${i * windowHeight - start_1 - startOffset - offsetProduct} top`,
//       end: () => `top+=${(i + 1) * windowHeight - end_1 - offsetProduct} top`,
//       scrub: 1
//     }
//   });
//   tl.to(product, { x : 0, opacity: 1 , ease: "none" })
//   .to(product, { y: 300 , opacity: 0, delay: 0.5,  ease: "none" });
// });

// let prod_images = gsap.utils.toArray(".prod-img");
// gsap.set(prod_images, { scale: 0.7 , opacity:0 });
// prod_images.forEach((image, i) => {
//   let startOffset = windowHeight * overlap_1;
//   let tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: "#section_3",
//       start: () => `top+=${i * windowHeight - start_1  - startOffset - offsetProduct} top`,
//       end: () => `top+=${(i + 1) * windowHeight - end_1 - offsetProduct} top`,
//       scrub: 1
//     }
//   });
  
//   // Step 1: Entrance
//   tl.to(image, { opacity: 1, scale: 1 ,  ease: "none"})
//   .to(image, { opacity: 0, scale: 0.5, filter: "brightness(0.8) blur(15px)", ease: "none", delay: 0.5,}
//   );
// });

// let dotAnimation = null;
// let section = 513;
// let addition = section * 1

// // ScrollTrigger to lock slides when entering section - FIXED
// ScrollTrigger.create({
//   trigger: "#section_3",
//   start: "top top",
//   pinSpacing: true,
//   end: () => {
//     const section = document.querySelector('#section_3');
//     const contentHeight = section.scrollHeight * 2 + addition - endSoon;
//     const triggerHeight = section.offsetHeight;
//     const percentage = (contentHeight / triggerHeight) * 100;
//     return `${percentage}%`;
//   },
//   pin: "#section_3",
//   onToggle: (self) => {
//     if (self.isActive) {
//       // Section is in view - start blinking
//       dotAnimation = gsap.fromTo(".rect",
//         { fill: "#171717e0"},
//         {
//           fill: "#eefe1266",
//           stagger: 0.2,
//           ease: "none",
//           duration: 0.2,
//           repeat: -1,
//           repeatDelay: 0.5,
//           yoyo: true
//         }
//       );
//     } else {
//       // Section is out of view - stop blinking
//       if (dotAnimation) {
//         dotAnimation.kill();
//         dotAnimation = null;
//         gsap.set(".rect", { fill: "#171717e0" });
//       }
//     }
//   },
//   onEnter: hideNav,
//   onEnterBack: hideNav,
//   onLeave: showNav,
//   onLeaveBack: showNav,
// //   markers: true
// });
// // ScrollTrigger.create({
// //     trigger: "#section_3",
// //     start: () => `top+=${i * windowHeight - 200 - startOffset} top`,
// //     end: () => `top+=${(i + 1) * windowHeight - 200} top`,
// //     scrub: 1,
// //     markers: true,
// // })


// Grow the closing CTA card in as it scrolls into view. Skipped on mobile:
// the card is already sized for the screen there (and on the home page the
// trigger, #section_1, is hidden, so it would stay stuck at 0.6).
if (!CONFIG.isMobile) {
  gsap.set('.call-to-action', {scale: 0.6})
  gsap.to('.call-to-action', {
    scale: 1,
    ease: "none",
    scrollTrigger: {
      trigger: ".features-icons",
      start: ()=> `top-=100px top`,
      end: ()=> `bottom-=100px bottom`,
      scrub: 1,
      // markers: true
    }
  });
}



// ------------------------------------------------------------------- Opening animation
const tl = gsap.timeline();
const tm = CONFIG.openingTimelineDuration;

setTimeout(() => {
  tl.fromTo(
  ".circle-el, .nine-el",
  { x: 600 },
  {
    duration: tm - 0.95,
    x: 0,
    opacity: 1,
    rotation: 360,
    transformOrigin: "50% 50%",
    stagger: 0.05,
    ease: "sine.out",
  }
)
  .to("#logo_svg", { width: 200, x: 0, duration: 0.3 })
  .fromTo(
    ".letter-el",
    { x: 600 },
    {
      duration: tm - 0.95,
      x: 0,
      opacity: 1,
      transformOrigin: "50% 50%",
      stagger: 0.05,
      ease: "power4.out",
      delay: -0.19,
    }
  )
  .to("#opening", { opacity: 0,  scale: `${CONFIG.isMobile? 1 : 2 }`, duration: 0.7, ease: "power2.out" })
  .set("#opening", { display: "none" });
}, 200);

// ------------------------------------------------------------------- Lottie birds
// if (birdsEl) {
//   birdAnimation = lottie.loadAnimation({
//     container: birdsEl,
//     renderer: "svg",
//     loop: true,
//     autoplay: true,
//     animationData,
//   });
// }

// Header background scale
if (headerBackground) {
  gsap.to(headerBackground, { scale: 1, duration: 11.4, ease: "none" });
}

// Birds fly across
// setTimeout(() => {
//   if (birdsEl) {
//     gsap.to(birdsEl, {
//       right: "90vw",
//       scale: 1.3,
//       duration: 10,
//       ease: "none",
//     });
//     setTimeout(() => {
//       if (birdsEl) {
//         gsap.to(birdsEl, {
//           opacity: 0,
//           duration: 1,
//           ease: "none",
//           onComplete: () => {
//             birdsEl.remove();
//             if (birdAnimation) birdAnimation.destroy();
//           },
//         });
//       }
//     }, 9000);
//   }
// }, CONFIG.birdDelay);

// Header description
setTimeout(() => {
  if (headerDesc) {
    gsap.to(headerDesc, { opacity: 1, duration: 0.8, ease: "none" });
  }
}, CONFIG.headerDescDelay);

setTimeout(() => {
    if(navigator){
     gsap.to(navigator, { opacity: 1, duration: 0.8, ease: "none" });
     gsap.to(".logo_header", { opacity: 1, duration: 0.8, ease: "none" });
    }
}, CONFIG.navigatorDelay);

// Header title
if (headerTitle) {
  gsap.from(headerTitle, {
    opacity: 0,
    duration: 1.2,
    ease: "power1.out",
    delay: 1.4,
  });
}

// ------------------------------------------------------------------- SplitText function (optional)
function animateIn(element) {
  if (!element) return;
  const splitText = new SplitText(element, { type: "chars" });
  gsap.from(splitText.chars, {
    opacity: 0,
    duration: 4,
    ease: "power1.out",
    x: 30,
    stagger: 0.04,
    delay: 2.1,
  });
}


function changeBackground(path){
  $('.header_background').css('background' , `url('${path}')`)
}



$(document).ready(() => {
  $('.header_background').addClass(productName);
  const video = document.getElementById('customVideo');
  const container = document.getElementById('videoContainer');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const iconPlay = document.getElementById('iconPlay');
  const iconPause = document.getElementById('iconPause');
  function updatePlayPauseUI() {

    if (video.paused) {
      iconPlay.style.display = 'flex';
      iconPause.style.display = 'none';
      container.classList.remove('playing');
      gsap.to('.custom-play-pause' , { opacity: 1})
    } else {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'flex';
      container.classList.add('playing');
      gsap.to('.custom-play-pause' , { opacity: 0})
    }
  }
  function togglePlayPause() {
    if (video.paused) {
      video.play().catch(error => {
        console.warn('Playback failed:', error);
        updatePlayPauseUI();
      });
    } else {
      video.pause();
    }
    updatePlayPauseUI();
  }
  video.addEventListener('play', () => {
    updatePlayPauseUI();
  });
  video.addEventListener('pause', () => {
    updatePlayPauseUI();
  });
  video.addEventListener('ended', () => {
    updatePlayPauseUI();
  });
  playPauseBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    togglePlayPause();
  });
  container.addEventListener('click', (event) => {
    if (event.target === video || container.contains(event.target) && event.target !== playPauseBtn && !playPauseBtn.contains(event.target)) {
      togglePlayPause();
    }
  });
  video.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  video.addEventListener('error', () => {
    console.warn('Video failed to load.');
  });
  updatePlayPauseUI();
  video.load();
})


// ------------------------------------------------------------------- Event listeners
document.addEventListener("touchstart", handleTouchStart, { passive: true });


let faqBtn = gsap.utils.toArray(".faq-btn");
faqBtn.forEach((btn)=>{
    btn.addEventListener('click', function () {
      gsap.to('#faq' , {opacity: 1, display: 'flex'})
      gsap.to('.faq-section' , { top: 0})
    });
})


let bookBtn = gsap.utils.toArray(".book-btn");
bookBtn.forEach((btn)=>{
    btn.addEventListener('click', function () {
      gsap.to('#book-demo' , {opacity: 1, display: 'flex'})
      gsap.to('.book-section' , { top: 0})
    });
})


$(document).ready(() => {
  const closeBtn = document.querySelector('.close-btn');
  const closeBtnBook = document.querySelector('.close-btn-book');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      const faqSection = document.querySelector('.faq-section');
      if (faqSection) {
        gsap.to('.faq-section' , {top: 500 })
        gsap.to('#faq' , {opacity: 0, display: 'none'})
      }
    });
  }
  if (closeBtnBook) {
    closeBtnBook.addEventListener('click', function () {
      const faqSection = document.querySelector('.book-section');
      if (faqSection) {
        gsap.to('.book-section' , {top: 500 })
        gsap.to('#book-demo' , {opacity: 0, display: 'none'})
      }
    });
  }
})



//---------MOBILE----------------


//-------------------------------------------------------------------------------------------------Menu Mobile
function menu() {
  gsap.to(".hidden-menu-cont", {
    duration: .5,
    top: 0,
  }), gsap.to(".mobile-nav-item", {
    duration: .5,
    y: 0,
    opacity: 1,
    delay: .1,
    stagger: .05
  })
}

function menuHide() {
  gsap.to(".hidden-menu-cont", {
    duration: .5,
    top: "-100vh",
    delay: .4
  }), gsap.to(".mobile-nav-item", {
    duration: .2,
    y: -50,
    opacity: 0,
    stagger: .05
  })
}

let current = 0;
function menuToggle() {
  0 === current ? ($(".nav-icon3").toggleClass("open"), menu(), current = 1) : 1 === current && ($(".nav-icon3").toggleClass("open"), menuHide(), current = 0)
}
$(".nav-hamburger").click((function () {
  menuToggle()
}));