import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

async function takeScreenshot() {
    const url = process.argv[2];
    const label = process.argv[3] || 'screenshot';
    
    if (!url) {
        console.error("Por favor, ingresa una URL: node screenshot.mjs http://localhost:3000");
        process.exit(1);
    }

    const dir = './temporary screenshots';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const timestamp = Date.now();
    const fileName = `${dir}/screenshot-${timestamp}-${label}.png`;
    
    await page.screenshot({ path: fileName, fullPage: true });
    console.log(`Captura guardada en: ${fileName}`);
    
    await browser.close();
}

takeScreenshot();