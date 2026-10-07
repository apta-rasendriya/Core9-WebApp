<?php
declare(strict_types=1);
// Closing markup shared by index.php and article.php: the Book a Demo
// section, footer, demo popup and scripts. Uses $asset from head.php.
?>
<section class="cta" id="demo" aria-label="Book a demo">
  <div class="glow a"></div><div class="glow b"></div>
  <div class="radar" aria-hidden="true"></div>
  <div class="wrap">
    <span class="eyebrow" data-scramble style="margin-bottom:28px">Book a demo</span>
    <h2 class="h2 split">See what Core9 finds in your operation.</h2>
    <p class="lead" data-reveal>Bring your fleet, facility or store data. We will show you where the loss is and what it is worth.</p>
    <div class="cta__row" data-reveal>
      <a class="btn btn--gold btn--xl magnet" href="#book-demo">Book a Demo <svg class="arr"><use href="#i-arrow"/></svg></a>
      <a class="btn btn--ghost btn--xl magnet" href="mailto:info@core9.ai">info@core9.ai</a>
    </div>
  </div>
</section>
</main>

<?php require __DIR__ . '/footer.php'; ?>
<?php require __DIR__ . '/demo.php'; ?>

<script src="<?= $asset('assets/js/vendor/gsap.min.js') ?>"></script>
<script src="<?= $asset('assets/js/vendor/ScrollTrigger.min.js') ?>"></script>
<script src="<?= $asset('assets/js/vendor/SplitText.min.js') ?>"></script>
<script src="<?= $asset('assets/js/vendor/lenis.min.js') ?>"></script>
<script src="<?= $asset('assets/js/main.js') ?>"></script>
<script src="<?= $asset('assets/js/insights.js') ?>"></script>
<script src="<?= $asset('assets/js/site.js') ?>"></script>
</body>
</html>
