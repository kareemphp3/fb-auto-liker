const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/like', async (req, res) => {
    const { cookies, postUrl } = req.body;

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const parsedCookies = cookies.split(';').map(cookie => {
            const [name, ...rest] = cookie.trim().split('=');
            return { name, value: rest.join('='), domain: '.facebook.com', path: '/' };
        });

        await context.addCookies(parsedCookies);
        await page.goto(postUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(2000);

        const likeButton = await page.$('div[class*="x1ey2m1c"]');
        if (likeButton) {
            await likeButton.click();
            res.send('تم عمل لايك بنجاح');
        } else {
            res.send('❌ زر اللايك مش لاقيينه');
        }

        await browser.close();
    } catch (error) {
        console.error(error);
        await browser.close();
        res.send('❌ حصل خطأ أثناء التنفيذ');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
