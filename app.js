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
let alreadyFollowing = [];

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

const findAlreadyfollowings = async () => {
  const html = await axios
    .get(`https://github.com/${process.env.nickname}?tab=following`)
    .then((data) => data.data);

  const dom = new JSDOM(html);
  let mainClass = dom.window.document.getElementsByClassName(
    "Link--secondary pl-1"
  );

  for (let i = 0; i < mainClass.length; i++) {
    alreadyFollowing.push(mainClass[i].textContent);
  }
  return alreadyFollowing;
};

const followUsers = async () => {
  findFollowings("emirdmrgzr")
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.log(error);
    });

  // CHECKING IF THE USER IS THE OWNER OF THE ACCOUNT
  for (let i = 0; i < follower_usernames.length; i++) {
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
    findAlreadyfollowings()
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });

    await driver.get("https://www.github.com/");

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
      if (alreadyFollowing.includes(follower_usernames[i])) {
        i++;
        continue;
      }
      await driver.get(`https://github.com/${follower_usernames[i]}`);
      await driver.findElement(By.className("btn btn-block")).click();
    }
  } finally {
    console.log("ENDED SESSION");
  }
})();
