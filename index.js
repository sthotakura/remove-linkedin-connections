const csv = require('csv-parser');
const fs = require('fs');
const puppeteer = require('puppeteer');
const chalk = require('chalk');
require('log-timestamp');

const browserEndpoint = "ws://127.0.0.1:9222/devtools/browser/231bb5bc-c83c-4405-969e-aeac5d07a62e";

const contacts = [];

(function () {
  fs.createReadStream('connections-to-remove.csv')
    .pipe(csv())
    .on('data', row => contacts.push(row['First Name'] + ' ' + row['Last Name']))
    .on('end', () => console.log('CSV parsing done. Contacts Count: ' + contacts.length));
})();

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: browserEndpoint
  })

  const pages = await browser.pages()
  let foundPage = undefined;
  console.log(pages.length)
  for (let i = 0; i < pages.length; ++i) {
    let url = pages[i]._target._targetInfo.url;
    if (url === "https://www.linkedin.com/mynetwork/invite-connect/connections/") {
      foundPage = pages[i]
      console.log(chalk.green("connections page found."))
      break;
    }
  }

  const page = foundPage

  page.setDefaultTimeout(2000);

  for (let l = 0; l < contacts.length; l++) {
    const contact = contacts[l];

    try {
      console.log(`Removing connection: ${contact}`)

      await page.waitForSelector('#mn-connections-search-input')
      await page.click('#mn-connections-search-input')
      await page.evaluate(() => document.getElementById("mn-connections-search-input").value = "")
      await page.type('#mn-connections-search-input', contact)
  
      await page.waitFor(2000)
  
      await page.waitForSelector("#ember50 > ul")

      await page.waitForSelector('.mn-connection-card__action-container button[data-control-name="ellipsis"]')
      await page.click('.mn-connection-card__action-container button[data-control-name="ellipsis"]')

      await page.waitForSelector('.artdeco-dropdown__content-inner .display-flex > .mn-connection-card__dropdown-option-text')
      await page.click('.artdeco-dropdown__content-inner  .display-flex > .mn-connection-card__dropdown-option-text')

      await page.waitForSelector('button[data-control-name="confirm_removed"]')
      await page.click('button[data-control-name="confirm_removed"]')

      console.log(chalk.green(`Removed connection ${contact}`))
    }
    catch {
      console.error(chalk.yellow(`Failed to remove connection ${contact}`));
    }
    }

    console.log(chalk.green("done."))
})();