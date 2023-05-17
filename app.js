"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_js_1 = __importDefault(require("selenium-webdriver/chrome.js"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const axios_1 = __importDefault(require("axios"));
const jsdom_1 = require("jsdom");
let follower_usernames = [];
let alreadyFollowing = [];
const findFollowings = (username) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const html = yield axios_1.default
        .get(`https://github.com/${username}?tab=followers`)
        .then((data) => data.data);
    const dom = new jsdom_1.JSDOM(html);
    const nextLink = (_a = dom.window.document.querySelector(".pagination")) === null || _a === void 0 ? void 0 : _a.lastChild;
    if (nextLink instanceof HTMLAnchorElement) {
        const url = nextLink.href;
        try {
            console.log(url);
            const html2 = yield axios_1.default.get(url).then((data) => data.data);
            const dom2 = new jsdom_1.JSDOM(html2);
            let mainClass = dom2.window.document.getElementsByClassName("Link--secondary pl-1");
            for (let i = 0; i < mainClass.length; i++) {
                const textContent = mainClass[i].textContent;
                if (textContent !== null) {
                    follower_usernames.push(textContent);
                }
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    let mainClass = dom.window.document.getElementsByClassName("Link--secondary pl-1");
    for (let i = 0; i < mainClass.length; i++) {
        const textContent = mainClass[i].textContent;
        if (textContent !== null) {
            follower_usernames.push(textContent);
        }
    }
    return follower_usernames;
});
const findAlreadyfollowings = () => __awaiter(void 0, void 0, void 0, function* () {
    const html = yield axios_1.default
        .get(`https://github.com/${process.env.nickname}?tab=following`)
        .then((data) => data.data);
    const dom = new jsdom_1.JSDOM(html);
    let mainClass = dom.window.document.getElementsByClassName("Link--secondary pl-1");
    for (let i = 0; i < mainClass.length; i++) {
        const textContent = mainClass[i].textContent;
        if (textContent !== null) {
            alreadyFollowing.push(textContent);
        }
    }
    return alreadyFollowing;
});
const followUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    findFollowings("--username-here--")
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
        yield axios_1.default
            .get(`https://github.com/${user}?tab=followers`)
            .then((data) => data.data);
    }
});
followUsers();
(function followUser() {
    return __awaiter(this, void 0, void 0, function* () {
        let chromeOptions = new chrome_js_1.default.Options();
        chromeOptions.excludeSwitches("enable-automation");
        let driver = yield new selenium_webdriver_1.Builder()
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
            yield driver.get("https://www.github.com/");
            yield driver
                .findElement(selenium_webdriver_1.By.className("HeaderMenu-link HeaderMenu-link--sign-in flex-shrink-0 no-underline d-block d-lg-inline-block border border-lg-0 rounded rounded-lg-0 p-2 p-lg-0"))
                .click();
            yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css("#login_field")), 10000);
            yield driver
                .findElement(selenium_webdriver_1.By.css("#login_field"))
                .sendKeys(process.env.nickname);
            yield driver.wait(selenium_webdriver_1.until.elementLocated(selenium_webdriver_1.By.css("#password")), 10000);
            yield driver
                .findElement(selenium_webdriver_1.By.css("#password"))
                .sendKeys(process.env.password, selenium_webdriver_1.Key.RETURN);
            for (let i = 0; i < follower_usernames.length; i++) {
                if (alreadyFollowing.includes(follower_usernames[i])) {
                    i++;
                    continue;
                }
                yield driver.get(`https://github.com/${follower_usernames[i]}`);
                yield driver.findElement(selenium_webdriver_1.By.className("btn btn-block")).click();
            }
        }
        finally {
            console.log("ENDED SESSION");
        }
    });
})();
