import { Builder, By, Key, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { JSDOM } from "jsdom";

let follower_usernames: Array<string> = [];
let alreadyFollowing: Array<string> = [];

const findFollowings = async (username: string) => {
  const html = await axios
    .get(`https://github.com/${username}?tab=followers`)
    .then((data) => data.data);

  const dom = new JSDOM(html);

  const nextLink = dom.window.document.querySelector(".pagination")
    ?.lastChild as HTMLAnchorElement;

  if (nextLink) {
    const url = nextLink.href;
    try {
      console.log(url);
      const html2 = await axios.get(url).then((data) => data.data);
      const dom2 = new JSDOM(html2);

      let mainClass = dom2.window.document.getElementsByClassName(
        "Link--secondary pl-1"
      );
      for (let i = 0; i < mainClass.length; i++) {
        const textContent = mainClass[i].textContent;
        if (textContent !== null) {
          follower_usernames.push(textContent);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
  let mainClass = dom.window.document.getElementsByClassName(
    "Link--secondary pl-1"
  );

  for (let i = 0; i < mainClass.length; i++) {
    const textContent = mainClass[i].textContent;
    if (textContent !== null) {
      follower_usernames.push(textContent);
    }
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
    const textContent = mainClass[i].textContent;
    if (textContent !== null) {
      alreadyFollowing.push(textContent);
    }
  }
  return alreadyFollowing;
};

const followUsers = async () => {
  findFollowings("yusuf-eren")
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
      .sendKeys(process.env.nickname!);

    await driver.wait(until.elementLocated(By.css("#password")), 10000);
    await driver
      .findElement(By.css("#password"))
      .sendKeys(process.env.password!, Key.RETURN);

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
