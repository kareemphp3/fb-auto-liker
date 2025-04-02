const express = require('express');
const bodyParser = require('body-parser');
const { chromium } = require('playwright');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index', { message: null });
});

app.post('/like', async (req, res) => {
  const { cookies, postUrl } = req.body;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    const cookieArray = cookies.split(';').map(cookie => {
      const [name, ...rest] = cookie.trim().split('=');
      return { name, value: rest.join('='), domain: '.facebook.com', path: '/' };
    });

    await context.addCookies(cookieArray);
    const page = await context.newPage();
    await page.goto(postUrl, { waitUntil: 'domcontentloaded' });

    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(3000);

    const likeBtn = await page.$('[class*="x1ey2m1c"]');
    if (likeBtn) {
      await likeBtn.click();
      res.render('index', { message: 'تم عمل لايك بنجاح' });
    } else {
      res.render('index', { message: '❌ زر اللايك مش لاقيينه' });
    }
  } catch (e) {
    res.render('index', { message: 'حصل خطأ أثناء المحاولة' });
  } finally {
    await browser.close();
  }
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));
