import puppeteer from "puppeteer";
const APP = "http://localhost/tagify";

let page;
let browser;
const width = 1920;
const height = 1080;

beforeAll(async () => {
    browser = await puppeteer.launch(
        {
            headless : false,
            slowMo   : 80,
            args     : [`--window-size=${width},${height}`]
        }
    );
    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
    await page.setViewport({ width, height });
    await page.goto(APP);
});

afterAll(() => {
    browser.close();
});


describe("simple test", () => {
  it("duplicate tags removed", async () => {
   // await page.goto(APP);
    // await page.waitForSelector(".some_class_name");
    // await page.waitForSelectorRemoval('.some_class_name tag:last-of-type')

    function getAllTagsTexts(){
        let data = [];
        document.querySelectorAll('.tagify.some_class_name tag').forEach(el => data.push( el.textContent.trim() ))
        return data;
    }

    let texts = await page.evaluate(getAllTagsTexts);
    expect(texts).toEqual(["css", "html", "javascript", "css"]);

    await page.waitFor(1000)

    texts = await page.evaluate(getAllTagsTexts);
    expect(texts).toEqual(["css", "html", "javascript"]);
  }, 3000);

  it("first tagify input has focus", async () => {
    await page.waitForSelector(".some_class_name");

    const focusedElm = await page.$eval(".tagify.some_class_name .tagify__input", el => el === document.activeElement);
    expect(focusedElm).toBeTruthy();
  }, 3000);

  it("input has placeholder", async () => {
   // await page.goto(APP);
    await page.waitForSelector(".some_class_name");

    const dataset = await page.$eval(".tagify.some_class_name .tagify__input", el => el.getAttribute('data-placeholder') );
    const placeholder = await page.$eval(".tagify.some_class_name .tagify__input", el => el.getAttribute('data-placeholder') );

  //  expect(dataset).toMatchObject({ "placeholder":expect.any(String) });
    expect(placeholder).toEqual(expect.any(String));
  }, 3000);


});