/*
 * Lighthouse CI assertions.
 *
 * JavaScript rather than JSON so the performance threshold can carry its reasoning. A
 * bare number in a JSON file is the kind of thing someone later "fixes" by lowering it
 * again, or worse, by degrading the site to satisfy it.
 *
 * WHY PERFORMANCE IS A WARNING AND NOT AN ERROR
 *
 * This site renders WebGL on every page: a 3D brand mark in the header, and a 3D plaque
 * on most pages. The GitHub Actions runner that executes this audit has no GPU, so
 * Chrome falls back to software rasterisation, and the cost of that is not a cost any
 * real visitor pays.
 *
 * The measurements, from run 33540511495 and local profiling:
 *
 *   - Lighthouse attributes a single 9,291ms task to js/brand-3d.js on contact.html - a
 *     page that renders no 3D of its own beyond the header mark.
 *   - Main-thread "Other" work is 10,447ms against 652ms of Script Evaluation. That
 *     shape is GPU work, not JavaScript.
 *   - The identical scene, measured on real hardware with the GPU flushed so shader
 *     compilation is included, initialises in about 60ms. That is a 155x gap, and the
 *     configured CPU throttle is 4x. Software rendering accounts for the rest.
 *   - Loading is genuinely fast: LCP 1.1-1.7s, FCP under 1.4s, CLS 0.000 on all four
 *     audited pages. Total Blocking Time is the only failing metric, and it is failing
 *     because of the software rasteriser.
 *
 * Two fixes were tried and measured rather than assumed:
 *
 *   - Deferring the brand mark to requestIdleCallback made it WORSE. TBT counts long
 *     tasks between FCP and TTI, so moving the block later pushed it into the measured
 *     window: TBT went from ~6,600ms to ~9,500ms and contact's LCP from 1.1s to 5.2s.
 *     Reverted.
 *   - Baking the PMREM environment to a cubemap saves 37% of init, but an 8-bit bake
 *     crushes RoomEnvironment's emissive range and the mark renders visibly duller.
 *     Not shipped. An HDR bake would preserve it and is the option if this ever needs
 *     revisiting.
 *
 * So the number is reported, tracked and visible, but does not fail the build, because
 * it does not measure what it claims to for this site. Everything that DOES measure
 * something real here - accessibility, SEO, best practices, and the specific audits
 * below - stays an error and still blocks.
 *
 * Revisit this if: the runner gains GPU support, the 3D is removed, or field data
 * (CrUX) shows real users hitting poor INP or LCP. Field data beats this lab number.
 */

module.exports = {
  ci: {
    assert: {
      assertions: {
        // Reported, not blocking. See the note above.
        'categories:performance': ['warn', { minScore: 0.7 }],

        // These measure things a GPU-less runner reports honestly.
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],

        // Loading IS fast here and there is no reason to let it regress unnoticed, so
        // the load metrics are asserted directly even though the composite score is not.
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        'is-crawlable': 'error',
        'document-title': 'error',
        'meta-description': 'error',
        'http-status-code': 'error',
        'link-text': 'error',
        'crawlable-anchors': 'error',
        'image-alt': 'error',
        'canonical': 'error',
      },
    },
  },
};
