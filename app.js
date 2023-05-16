import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import axios from "axios";
import { JSDOM } from "jsdom";

const app = express();
app.use(express.json());

let follower_usernames = [];
const findFollowings = async (username) => {
  const html = await axios
    .get(`https://github.com/${username}?tab=followers`)
    .then((data) => data.data);

  const dom = new JSDOM(html);
  let mainClass = dom.window.document.getElementsByClassName(
    "Link--secondary pl-1"
  );

  for (let i = 0; i < mainClass.length; i++) {
    follower_usernames.push(mainClass[i].textContent);
  }
  return follower_usernames;
};

const followUsers = async () => {
  findFollowings("emirdmrgzr")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log(error);
    });

  for (let i = 0; i < follower_usernames; i++) {
    let user = follower_usernames[i];
    if (user === process.env.nickname) {
      i++;
      continue;
    }
    await axios
      .get(`https://github.com/${user}?tab=followers`)
      .then((data) => data.data);
  }
};
followUsers();

(async function followUser() {
  let chromeOptions = new chrome.Options();
  chromeOptions.excludeSwitches("enable-automation");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(chromeOptions)
    .build();

  try {
    await driver.get("https://www.google.com/");

    await driver.findElement(By.name("q")).sendKeys("github", Key.RETURN);

    await driver.findElement(By.className("LC20lb MBeuO DKV0Md")).click();
    await driver
      .findElement(
        By.className(
          "HeaderMenu-link HeaderMenu-link--sign-in flex-shrink-0 no-underline d-block d-lg-inline-block border border-lg-0 rounded rounded-lg-0 p-2 p-lg-0"
        )
      )
      .click();

    await driver.wait(until.elementLocated(By.css("#login_field")), 10000);
    await driver
      .findElement(By.css("#login_field"))
      .sendKeys(process.env.nickname);

    await driver.wait(until.elementLocated(By.css("#password")), 10000);
    await driver
      .findElement(By.css("#password"))
      .sendKeys(process.env.password, Key.RETURN);

    for (let i = 0; i < follower_usernames.length; i++) {
      await driver.get(`https://github.com/${follower_usernames[i]}`);
      const unfollowButton = await driver.findElement(
        By.css("input[name='commit'][value='Unfollow']")
      );

      if (unfollowButton) {
        i++;
        continue;
      }

      await driver.findElement(By.className("btn btn-block")).click();
    }
  } finally {
    await driver.quit();
    console.log("ENDED SESSION");
  }
})();
