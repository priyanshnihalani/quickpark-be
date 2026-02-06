const puppeteer = require("puppeteer");

module.exports = async function generatePDF(html) {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new"
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true
  });

  await browser.close();
  return pdf;
};
