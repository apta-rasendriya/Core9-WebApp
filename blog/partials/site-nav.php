<?php
declare(strict_types=1);
// Core9 site navigation, matching the main site's navbar (Core9-web
// src/index.html + src/partials/mobile-nav.html). The main site is served at
// "/" and this blog at "/blog/", so main-site links are root-absolute.
// "/?scrollTo=...&type=..." is the main site's existing deep-link format
// (see scrollToFromURL in src/js/home.js); "/?demo=1" opens its Book a Demo
// form.
?>
<div id="navigation">
  <div class="nav-item">
    <a href="/"><img class="logo-square" src="assets/img/logo-square.png" alt="Core9" /></a>
  </div>
  <div class="nav-item menu-text"><a class="text" href="/?scrollTo=client_section&amp;type=class">Our Clients</a></div>
  <div class="nav-item menu-text"><a class="text" href="/?scrollTo=section_1&amp;type=id">Our System</a></div>
  <div class="nav-item menu-text">
    <a class="text" href="/?scrollTo=section_3&amp;type=id">Our Products</a>
    <div class="submenu">
      <a href="/drivesense/" class="text">DriveSense</a>
      <a href="/camcore/" class="text">CamCore</a>
      <a href="/illytical/" class="text">illytical</a>
    </div>
  </div>
  <div class="nav-item menu-text"><a class="text active" href="index.php">Insights</a></div>
  <div class="nav-item"><a class="cta" href="/?demo=1">Book a Demo</a></div>
</div>

<div class="mobil-nav-wrapper">
  <div id="mobile-nav">
    <div class="logo-section">
      <a class="logo_container_mobile" href="/"><img class="logo_header_mobile" src="assets/img/core9-logo-white.png" alt="Core9" /></a>
    </div>
    <button class="nav-hamburger" type="button" aria-label="Toggle menu" aria-expanded="false">
      <span class="nav-icon3"><span></span><span></span><span></span><span></span></span>
    </button>
  </div>
  <div class="hidden-menu-cont">
    <div class="nav-hidden">
      <a class="mobile-nav-item" href="/?scrollTo=client_section&amp;type=class">Our Clients</a>
      <a class="mobile-nav-item" href="/?scrollTo=section_1&amp;type=id">Our System</a>
      <div class="mobile-nav-group">
        <a class="mobile-nav-item" href="/?scrollTo=section_3&amp;type=id">Our Products</a>
        <div class="mobile-submenu">
          <a href="/drivesense/" class="mobile-nav-item">- DriveSense</a>
          <a href="/camcore/" class="mobile-nav-item">- CamCore</a>
          <a href="/illytical/" class="mobile-nav-item">- illytical</a>
        </div>
      </div>
      <a class="mobile-nav-item active" href="index.php">Insights</a>
      <div class="mobile-nav-item-book"><a class="cta" href="/?demo=1">Book a Demo</a></div>
    </div>
  </div>
</div>
