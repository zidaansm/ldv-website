const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set viewport to exactly 375px wide (iPhone SE size)
  await page.setViewport({ width: 375, height: 667, isMobile: true, hasTouch: true });
  
  // Navigate to local dev server
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // Run the user's requested script
  const results = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    
    let isOverflowing = scrollWidth > docWidth;
    let overflowingElements = [];

    [...document.querySelectorAll('*')].forEach(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el); if ((rect.right > docWidth || rect.left < 0) && style.position !== "fixed" && style.position !== "absolute" && el.tagName !== "SCRIPT" && el.tagName !== "STYLE") {
        let className = el.className;
        if (typeof className !== 'string') {
          className = className.baseVal || '';
        }
        overflowingElements.push({
          tagName: el.tagName,
          className: className,
          left: rect.left,
          right: rect.right
        });
      }
    });

    return {
      docWidth,
      scrollWidth,
      isOverflowing,
      overflowingElements
    };
  });

  console.log("Viewport clientWidth:", results.docWidth);
  console.log("Viewport scrollWidth:", results.scrollWidth);
  console.log("Is Document Overflowing:", results.isOverflowing);
  console.log("Overflowing Elements:");
  results.overflowingElements.forEach(el => {
    console.log(`- <${el.tagName}> class="${el.className}" | left: ${el.left} | right: ${el.right}`);
  });

  await browser.close();
})();


