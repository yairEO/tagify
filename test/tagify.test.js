const puppeteer = require("puppeteer");
const path = require("path");
const APP = `file:${path.join(__dirname, '../', 'index.html')}`

let page;
let browser;
const width = 1920;
const height = 1080;

let elmSelectors = {
    tagify : {
        scope         : ".some_class_name",
        input         : ".tagify.some_class_name .tagify__input",
        originalInput : "input.some_class_name",
        firstTag      : ".tagify__tag"
    }
}


beforeAll(async () => {
    browser = await puppeteer.launch(
        {
            headless: false,
            slowMo  : 80,
            args    : [`--window-size = ${width},${height}`]
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


describe("simple tests", () => {
    it("duplicate tags removed", async () => {
        // await page.goto(APP);
        // await page.waitForSelector(".some_class_name");
        // await page.waitForSelectorRemoval('.some_class_name tag:last-of-type')

        function getAllTagsTexts(elmSelectors) {
            let data = [];
            document.querySelectorAll(elmSelectors.tagify.scope + ' tag').forEach(el => data.push(el.textContent.trim()))
            return data;
        }

        let texts = await page.evaluate(getAllTagsTexts, elmSelectors);
        expect(texts).toEqual(["css", "html", "javascript", "css"]);

        await page.waitFor(1000)

        texts = await page.evaluate(getAllTagsTexts, elmSelectors);
        expect(texts).toEqual(["css", "html", "javascript"]);
    }, 2000);

    it("first tagify input has focus", async () => {
        await page.waitForSelector(elmSelectors.tagify.scope);

        const focusedElm = await page.$eval(elmSelectors.tagify.input, el => el === document.activeElement);
        expect(focusedElm).toBeTruthy();
    }, 1000);

    it("input has placeholder", async () => {
        // await page.goto(APP);
        await page.waitForSelector(elmSelectors.tagify.scope);

     //   const dataset = await page.$eval(elmSelectors.input, el => el.getAttribute('data-placeholder'));
        const placeholder = await page.$eval(elmSelectors.tagify.input, el => el.getAttribute('data-placeholder'));

        //  expect(dataset).toMatchObject({ "placeholder":expect.any(String) });
        expect(placeholder).toEqual(expect.any(String));
    }, 1000);

    it("has correct value attribute for the original input", async () => {
        await page.waitForSelector(elmSelectors.tagify.scope);

        const expectedValue = '[{"value":"css"},{"value":"html"},{"value":"javascript"}]',
              originalInputValue = await page.$eval(elmSelectors.tagify.originalInput, el => el.value);

        expect(originalInputValue).toEqual(expectedValue);
    }, 1000);

    it("correct tag template", async () => {
        await page.waitForSelector(elmSelectors.tagify.scope);

        const expected = '[{"value":"css"},{"value":"html"},{"value":"javascript"}]',
              originalInputValue = await page.$eval(elmSelectors.tagify.originalInput, el => el.value);

        expect(originalInputValue).toEqual(expected);
    }, 1000)
})

describe("templates snapshots", () => {
    it("should render correct <tag> template", async () => {
        await page.waitForSelector(elmSelectors.tagify.scope);

        const expected = '<tag title="css" contenteditable="false" spellcheck="false" class="tagify__tag tagify--mark tagify--noAnim" role="tag" value="css"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text">css</span></div></tag>',
              originalInputValue = await page.$eval(elmSelectors.tagify.firstTag, el => el.outerHTML);

        expect(originalInputValue).toEqual(expected);
    }, 1000)
})

describe("actions", () => {
    it("should allow tag editing when double-click a tag", async () => {
        await page.waitForSelector(elmSelectors.tagify.firstTag);
        await page.click(elmSelectors.tagify.firstTag, { clickCount: 2 });

        let expected = '<tag title="css" contenteditable="false" spellcheck="false" class="tagify__tag tagify--mark tagify--noAnim tagify--editable" role="tag" value="css"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text" contenteditable="true">css</span></div></tag>',
            tagTemplate = await page.$eval(elmSelectors.tagify.firstTag, el => el.outerHTML);

        expect(tagTemplate).toEqual(expected);

        async function getFirstTagText(){
            return await page.$eval(elmSelectors.tagify.firstTag, el => el.querySelector('.tagify__tag-text').textContent);
        }

        expected = 'test 123';
        let prevTagText = await getFirstTagText();
        await page.type(elmSelectors.tagify.firstTag + ' .tagify__tag-text', expected)
        page.keyboard.press('Enter')

        let tagTextContent = await getFirstTagText();
        expect(tagTextContent).toEqual(expected + prevTagText);


    }, 0)
})

