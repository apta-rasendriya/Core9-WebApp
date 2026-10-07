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
  // Snap-to-section on the client logos and stats sections. Off: it stops
  // the user's scrolling, and with normal scroll speed it can snap back on
  // every wheel tick, leaving the page stuck at #section_2.
  snapSections: false,
};

// ------------------------------------------------------------------- DOM elements
const container = document.querySelector(".scroll-container");
const slides = document.querySelectorAll(".slide");
const birdsEl = document.getElementById("birds");
const headerBackground = document.querySelector(".header_background");
const headerDesc = document.querySelector(".header-desc");
const headerTitle = document.querySelector(".header-title");
const navigator = document.querySelector("#navigation");

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
  gsap.to('#navigation' , {opacity: 0, top: -100 , ease: "none" , duration: dur , delay: del})
  gsap.to('.logo_float' , {top: 0 , ease: "none" , duration: dur , delay: del})
}
function showNav(){
  gsap.to('#navigation' , {opacity: 1,top: 20 , ease: "none" , duration: dur , delay: del})
   gsap.to('.logo_float' , {top: -100 , ease: "none" , duration: dur , delay: del})
}

let clientPin;
let statPin;
let isScrolling = false;
let isProgrammaticScroll = false;






// Create trigger
function initClientPin() {
  if (!CONFIG.snapSections) return;

  if (!CONFIG.isMobile) {
    if (clientPin) {
      clientPin.kill();
    }

    clientPin = ScrollTrigger.create({
      trigger: ".client_section",
      start: "-100px top",
      end: "+=50%",
      onEnter: () => {
        // Don't trigger during programmatic scroll
        if (isScrolling || isProgrammaticScroll) return;
        isScrolling = true;

        locoScroll.stop();
        locoScroll.scrollTo('.client_section', {
          duration: 300,
          disableLerp: false,
        });

        setTimeout(() => {
          locoScroll.start();
          isScrolling = false;
        }, 700);
      },
      onEnterBack: () => {
        // Don't trigger during programmatic scroll
        if (isScrolling || isProgrammaticScroll) return;
        isScrolling = true;

        locoScroll.stop();
        locoScroll.scrollTo('.client_section', {
          duration: 300,
          disableLerp: false,
        });

        setTimeout(() => {
          locoScroll.start();
          isScrolling = false;
        }, 700);
      },
    });
  }




}


// Create trigger
function initStatPin() {
  if (!CONFIG.snapSections) return;
  if (!CONFIG.isMobile) {
    if (statPin) {
      statPin.kill();
    }

    statPin = ScrollTrigger.create({
      trigger: "#section_2",
      start: "top top",
      end: "+=50%",
      // markers: true,
      onEnter: () => {
        // Don't trigger during programmatic scroll
        if (isScrolling || isProgrammaticScroll) return;
        isScrolling = true;

        locoScroll.stop();
        locoScroll.scrollTo('#section_2', {
          duration: 300,
          disableLerp: false,
        });

        setTimeout(() => {
          locoScroll.start();
          isScrolling = false;
        }, 700);
      },
      onEnterBack: () => {
        // Don't trigger during programmatic scroll
        if (isScrolling || isProgrammaticScroll) return;
        isScrolling = true;

        locoScroll.stop();
        locoScroll.scrollTo('#section_2', {
          duration: 300,
          disableLerp: false,
        });

        setTimeout(() => {
          locoScroll.start();
          isScrolling = false;
        }, 700);
      },
    });
  }


}


// Scroll function for other sections
function scrollTo(target, smooth) {
  const element = document.querySelector(target);
  if (!element) return;
  
  // Mark as programmatic scroll
  isProgrammaticScroll = true;
  
  // Kill pin temporarily
  if (clientPin || statPin) {
    statPin.kill();
    clientPin.kill();
    clientPin = null;
    statPin = null;
  }

  let smoothTrue = smooth === true ? false : true;
  const currentScroll = locoScroll.scroll.instance.scroll.y;
  const targetScroll = element.offsetParent.offsetTop;
  const offset = currentScroll > targetScroll ? -20 : 20;
   
  
  locoScroll.scrollTo(target, {
    offset: offset,
    duration: smoothTrue ? 0 : 300,
    disableLerp: smoothTrue,
    onComplete: () => {
      // Recreate pin after scroll
      setTimeout(() => {
        initClientPin();
        initStatPin()
        // Reset flag after pin is recreated
        setTimeout(() => {
          isProgrammaticScroll = false;
        }, 100);
      }, 100);
    }
  });
  
  // Fallback
  setTimeout(() => {
    if (!clientPin) {
      initClientPin();
      initStatPin()
      setTimeout(() => {
        isProgrammaticScroll = false;
      }, 100);
    }
  }, 500);
}



initClientPin();



let overlap_1 = 0.5;
let start_1 = windowHeight - 1000;
let end_1 = windowHeight - 700;
let endSoon = windowHeight /  2 - 300;


  let step_prod = gsap.utils.toArray(".step_prod");
  step_prod.forEach((step, i) => {
    let startOffset = windowHeight * overlap_1;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section_3",
        start: () => `top+=${i * windowHeight - start_1 - startOffset - offsetProduct} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1 - offsetProduct} top`,
        scrub: 1
        // markers: true
      }
    });
    tl.to(step, { background: "#D89A1D", ease: "none" })
      .to(step, { background: "#D89A1D00", delay: 0.5, ease: "none" })
  });

  let prod_images = gsap.utils.toArray(".prod-img");
  gsap.set(prod_images, { scale: 0.7, opacity: 0 });
  prod_images.forEach((image, i) => {
    let startOffset = windowHeight * overlap_1;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section_3",
        start: () => `top+=${i * windowHeight - start_1 - startOffset - offsetProduct} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1 - offsetProduct} top`,
        scrub: 1
      }
    });

    // Step 1: Entrance
    tl.to(image, { opacity: 1, scale: 1, ease: "none" })
      .to(image, { opacity: 0, scale: 0.5, filter: "brightness(0.8) blur(15px)", ease: "none", delay: 0.5, }
      );
  });

// if(CONFIG.isMobile){
//     let prod_images = gsap.utils.toArray(".product-img-slide");
//     prod_images.forEach((img, i) => {
//     let startOffset = windowHeight * overlap_1;
//     let tl = gsap.timeline({
//       scrollTrigger: {
//         trigger: "#section_3",
//         start: () => `top+=${i * windowHeight - start_1 - startOffset - offsetProduct} top`,
//         end: () => `top+=${(i + 1) * windowHeight - end_1 - offsetProduct} top`,
//         scrub: 1
//         // markers: true
//       }
//     });
//     tl.to(img, { opacity: 1, ease: "none" })
//       .to(img, { opacity: 0, delay: 0.5, ease: "none" })
//   });
// }




let products = gsap.utils.toArray(".product-cont");
let offsetProduct = 0;
products.forEach((product, i) => {
  let startOffset = windowHeight * overlap_1;
  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#section_3",
      start: () => `top+=${i * windowHeight - start_1 - startOffset - offsetProduct} top`,
      end: () => `top+=${(i + 1) * windowHeight - end_1 - offsetProduct} top`,
      scrub: 1
    }
  });

  if(CONFIG.isMobile){
      tl.to(product, { y : 0, opacity: 1 , scale: 1, ease: "none" })
      .to(product, { x: 300 , opacity: 0, scale: 0.5, delay: 0.5,  ease: "none" });
  }else{
      tl.to(product, { x : 0, opacity: 1 , ease: "none" })
      .to(product, { y: 300 , opacity: 0, delay: 0.5,  ease: "none" });
  }
});

// let startOffset2 = windowHeight * overlap_1;
// let tl2 = gsap.timeline({
//   scrollTrigger: {
//     trigger: "#section_3",
//     start: () => `top+=${0 * windowHeight - start_1 - startOffset2 - offsetProduct} top`,
//     end: () => `top+=${ 2 * windowHeight - end_1 - offsetProduct} top`,
//     scrub: 1,
//     markers: true
//   }
// });
// tl2.to('.bar' ,{ width : '0%',  ease: "none" })
// .to('.bar', { width: '100%' ,  ease: "none" });




let dotAnimation = null;

// ScrollTrigger to lock slides when entering section - FIXED
ScrollTrigger.create({
  trigger: "#section_3",
  start: "top top",
  pinSpacing: true,
  end: () => {
    const section = document.querySelector('#section_3');
    const contentHeight = section.scrollHeight * 2 + 513 - endSoon;
    const triggerHeight = section.offsetHeight;
    const percentage = (contentHeight / triggerHeight) * 100;
    return `${percentage}%`;
  },
  pin: "#section_3",
  onToggle: (self) => {
    if (self.isActive) {
      // Section is in view - start blinking
      dotAnimation = gsap.fromTo(".rect",
        { fill: "#171717e0"},
        {
          fill: "#eefe1266",
          stagger: 0.2,
          ease: "none",
          duration: 0.2,
          repeat: -1,
          repeatDelay: 0.5,
          yoyo: true
        }
      );
    } else {
      // Section is out of view - stop blinking
      if (dotAnimation) {
        dotAnimation.kill();
        dotAnimation = null;
        gsap.set(".rect", { fill: "#171717e0" });
      }
    }
  },
  onEnter: hideNav,
  onEnterBack: hideNav,
  onLeave: showNav,
  onLeaveBack: showNav,
  // markers: true
});


// Separate ScrollTrigger for progress bar
// ScrollTrigger.create({
//   trigger: "#section_3",
//   start: "top top",
//    end: () => {
//     const section = document.querySelector('#section_3');
//     const contentHeight = section.scrollHeight * 2 + 513 - endSoon;
//     const triggerHeight = section.offsetHeight;
//     const percentage = (contentHeight / triggerHeight) * 100;
//     return `${percentage}%`;
//   },
//   scrub: 1,
//   onUpdate: (self) => {
//     // Update progress bar width based on scroll progress
//     const progress = self.progress * 100;
//     gsap.to('.bar', {
//       width: `${progress}%`,
//       duration: 0,
//       ease: "none"
//     });
//   },
//   onEnter: () => {
//     $('.scroll-bar').css('opacity' , 1)
//     // Start progress bar animation
//     gsap.to('.bar', {
//       width: '0%',
//       duration: 0,
//       ease: "none"
//     });
//   },
//   onLeave: () => {
//     $('.scroll-bar').css('opacity' , 0)
//     // Reset progress bar
//     gsap.to('.bar', {
//       width: '0%',
//       duration: 0,
//       ease: "none"
//     });
//   },
//   onEnterBack: () => {
//     $('.scroll-bar').css('opacity' , 1)
//     // Start progress bar animation
//     gsap.to('.bar', {
//       width: '0%',
//       duration: 0,
//       ease: "none"
//     });
//   },
//   onLeaveBack: () => {
//     $('.scroll-bar').css('opacity' , 0)
//     // Reset progress bar
//     gsap.to('.bar', {
//       width: '0%',
//       duration: 0,
//       ease: "none"
//     });
//   }
// });


initStatPin()
//--------------------------------------------------------------


if (!CONFIG.isMobile) {

  let images = gsap.utils.toArray(".content_image");
  gsap.set(images, { x: 0, y: 300, scale: 0.5 });

  images.forEach((image, i) => {
    let startOffset = windowHeight * overlap_1;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section_1",
        start: () => `top+=${i * windowHeight - start_1 - startOffset} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1} top`,
        scrub: 1,
        // markers: true
      }
    });

    tl.to(image, { y: 0, opacity: 1, scale: 1, ease: "none" })
      .to(image, { x: -500, opacity: 0, delay: 0.5, scale: 0.5, ease: "none" });
  });


  let content_text = gsap.utils.toArray(".content_text");
  gsap.set(content_text, { x: 700 });

  content_text.forEach((text, i) => {
    let startOffset = windowHeight * overlap_1;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section_1",
        start: () => `top+=${i * windowHeight - start_1 - startOffset} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1} top`,
        scrub: 1,
        // markers: true
      }
    });

    tl.to(text, { x: 0, opacity: 1, ease: "none" })
      .to(text, { y: 300, opacity: 0, delay: 0.5, ease: "none" });

  });

  let steps = gsap.utils.toArray(".step");

  steps.forEach((step, i) => {
    let startOffset = windowHeight * overlap_1;
    let tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#section_1",
        start: () => `top+=${i * windowHeight - start_1 - startOffset} top`,
        end: () => `top+=${(i + 1) * windowHeight - end_1} top`,
        scrub: 1,
        // markers: true
      }
    });
    tl.to(step, { background: "#424244", ease: "none" })
      .to(step, { background: "#42424400", delay: 0.5, ease: "none" })

  });

  // First pin (client section with delay)
  let isPaused = false;


  ScrollTrigger.create({
    trigger: "#section_1",
    start: 'top top',
    pinSpacing: true,
    // anticipatePin: 1,
    // pinReparent: true,
    end: () => {
      const section = document.querySelector('#section_1');
      const contentHeight = section.scrollHeight * 3 + 500;
      const triggerHeight = section.offsetHeight;
      const percentage = (contentHeight / triggerHeight) * 100;
      return `${percentage}%`;
    },
    pin: "#section_1",
    onEnter: hideNav,
    onEnterBack: hideNav,
    onLeave: showNav,
    onLeaveBack: showNav,
    // markers: true
  });
}




// Grow the closing CTA card in as it scrolls into view. Skipped on mobile:
// the card is already sized for the screen there (and on the home page the
// trigger, #section_1, is hidden, so it would stay stuck at 0.6).
if (!CONFIG.isMobile) {
  gsap.set('.call-to-action', {scale: 0.6})
  gsap.to('.call-to-action', {
    scale: 1,
    ease: "none",
    scrollTrigger: {
      trigger: "#section_1",
      start: ()=> `top+=${ windowHeight - 600} top`,
      end: ()=> `top+=${ windowHeight - 350} top`,
      scrub: 1,
      // markers: true
    }
  });
}



function animate(direction) {
  if (animateSection) return;

  const totalSlides = slides.length;
  const isUp = direction === "up";
  const isDown = direction === "down";

  // Handle exit conditions - FIXED with smooth scrolling
  if (isDown && currentSlide === totalSlides - 1) {
    console.log(direction, "should go down");
    const section = document.querySelector("#section_1");
    const lastSlide = slides[slides.length - 1];
    const targetScroll = section.offsetTop + lastSlide.offsetHeight;
    
    isScrollingToSection = true;
    locoScroll.scrollTo(targetScroll, {
      duration: 0.5,
      disableLerp: false,
      callback: () => {
        isScrollingToSection = false;
        startFrame();
      }
    });
    return;
  }
  
  if (isUp && currentSlide === 0) {
    console.log(direction, "should go up");
    const section = document.querySelector("#section_1");
    const targetScroll = section.offsetTop - 100;
    
    isScrollingToSection = true;
    locoScroll.scrollTo(targetScroll, {
      duration: 0.5,
      disableLerp: false,
      callback: () => {
        isScrollingToSection = false;
        startFrame();
      }
    });
    return;
  }

  // Normal slide navigation
  if (isUp && currentSlide > 0) {
    currentSlide--;
    go(currentSlide, "up");
  } else if (isDown && currentSlide < totalSlides - 1) {
    currentSlide++;
    go(currentSlide, "down");
  }

  function go(index, dir) {
    animateSection = true;
    slides.forEach((slide, i) => {
      const isActive = i === index;
      gsap.set(slide, { // Changed from gsap.to to gsap.set for instant changes
        display: isActive ? "block" : "none",
        opacity: isActive ? 1 : 0,
      });
    });
    setTimeout(() => {
      animateSection = false;
    }, CONFIG.slideSwitchDelay);
  }
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
  .to("#opening", { opacity: 0, scale: `${CONFIG.isMobile? 1 : 2 }`, duration: 0.7, ease: "power2.out" })
  .set("#opening", { display: "none" });
}, 200);

// ------------------------------------------------------------------- Lottie birds
if (birdsEl) {
  birdAnimation = lottie.loadAnimation({
    container: birdsEl,
    renderer: "svg",
    loop: true,
    autoplay: true,
    animationData,
  });
}

// Header background scale
if (headerBackground) {
  gsap.to(headerBackground, { scale: 1, duration: 11.4, ease: "none" });
}

// Birds fly across
setTimeout(() => {
  if (birdsEl) {
    gsap.to(birdsEl, {
      right: "90vw",
      scale: 1.3,
      duration: 10,
      ease: "none",
    });
    setTimeout(() => {
      if (birdsEl) {
        gsap.to(birdsEl, {
          opacity: 0,
          duration: 1,
          ease: "none",
          onComplete: () => {
            birdsEl.remove();
            if (birdAnimation) birdAnimation.destroy();
          },
        });
      }
    }, 9000);
  }
}, CONFIG.birdDelay);



$(document).ready(() => {
  // Header description
  setTimeout(() => {
    if (headerDesc) {
      gsap.to(headerDesc, { opacity: 1, duration: 0.8, ease: "none" });
    }
  }, CONFIG.headerDescDelay);


  if (!CONFIG.isMobile) {
    setTimeout(() => {
      if (navigator) {
        gsap.to(navigator, { opacity: 1, duration: 0.8, ease: "none" });
        gsap.to(".logo_header", { opacity: 1, duration: 0.8, ease: "none" });
      }
    }, CONFIG.navigatorDelay);
  }
  // Header title
  if (headerTitle) {
    gsap.from(headerTitle, {
      opacity: 0,
      duration: 1.2,
      ease: "power1.out",
      delay: 1.4,
    });
  }


  // Attach to navigation links
  document.querySelectorAll('.scrollTo').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('scrollTo');
      scrollTo(target, false);

      if(CONFIG.mobileNav.matches){
        menuToggle()
      }

    });
  });



})




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

// ------------------------------------------------------------------- Cleanup
window.addEventListener("beforeunload", () => {
  if (birdAnimation) birdAnimation.destroy();
  if (locoScroll) locoScroll.destroy();
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
});

// ------------------------------------------------------------------- Event listeners
document.addEventListener("touchstart", handleTouchStart, { passive: true });


let client_images = gsap.utils.toArray(".client_img");


function createInfiniteScroll() {
  const track = document.querySelector(".client_cont");
  
  if (!track) return;
  
  // Get original images
  const originalImages = document.querySelectorAll(".client_img");
  if (originalImages.length === 0) return;
  
  // Clear and add 2 sets
  track.innerHTML = "";
  
  originalImages.forEach(img => {
    track.appendChild(img.cloneNode(true));
  });
  originalImages.forEach(img => {
    track.appendChild(img.cloneNode(true));
  });
  

}


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
  const logoHeader = document.querySelector('.logo_header');
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
  if (logoHeader) {
      logoHeader.addEventListener('click', function () {
        window.location = '/'
    });
  }
  $(".hamburger").click(function(){
      $(this).toggleClass("is-active");
  });


  createInfiniteScroll()

})



function scrollToFromURL() {
    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const scrollTarget = urlParams.get('scrollTo');
    const type = urlParams.get('type');
    let attr = '';
    // Check if scrollTo parameter exists
    if (scrollTarget && type ) {
        switch (type) {
          case 'id':
            attr = '#'
            break;
          case 'class':
            attr = '.'
            break;        
        }

        scrollTo(attr+scrollTarget)

    }
}

// Run when page loads
window.addEventListener('load', scrollToFromURL);

// Open the Book a Demo form when linked as /?demo=1 (used by the blog)
function openDemoFromURL() {
    if (new URLSearchParams(window.location.search).get('demo') === '1') {
        gsap.to('#book-demo' , {opacity: 1, display: 'flex'})
        gsap.to('.book-section' , { top: 0})
    }
}
window.addEventListener('load', openDemoFromURL);





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