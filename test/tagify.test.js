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
    },

    countries : {
        scope         : ".countries",
        input         : ".tagify.countries .tagify__input",
        originalInput : "input.countries",
        firstTag      : ".tagify.countries .tagify__tag"
    }

}


beforeAll(async () => {
    browser = await puppeteer.launch(
        {
            headless: false,
            slowMo  : 80,
            args    : [`--window-size = ${width},${height}`]
        }
    )

    page = await browser.newPage()

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36')
    await page.setViewport({ width, height })
    await page.goto(APP);
})

afterEach(async () => {
    // clear input text
    const input = await page.$(elmSelectors.tagify.input)
    await input.click({ clickCount: 3 })
    await page.keyboard.press('Backspace')

    // reset the tags
    // TODO: use https://www.npmjs.com/package/jest-environment-puppeteer
})


afterAll(() => {
    browser.close();
})


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
        await page.waitForSelector(elmSelectors.countries.scope);

        const expectedValue = '[{"value":"Afghanistan","code":"AF"},{"value":"Åland Islands","code":"AX"}]',
              originalInputValue = await page.$eval(elmSelectors.countries.originalInput, el => el.value);

        expect(originalInputValue).toEqual(expectedValue);
    }, 1000);
})

describe("templates snapshots", () => {
    it("should render correct <tag> template", async () => {
        await page.waitForSelector(elmSelectors.tagify.scope);

        const expected = '<tag title="css" contenteditable="false" spellcheck="false" class="tagify__tag tagify--mark tagify--noAnim" role="tag" value="css"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text">css</span></div></tag>',
              originalInputValue = await page.$eval(elmSelectors.tagify.firstTag, el => el.outerHTML);

        expect(originalInputValue).toEqual(expected);
    }, 1000)

    it("should render correct custom <tag> template", async () => {
        await page.waitForSelector(elmSelectors.countries.scope);

        const expected = `<tag title="Afghanistan" contenteditable="false" spellcheck="false" class="tagify__tag " role="tag" code="AF" value="Afghanistan"><x title="remove tag" class="tagify__tag__removeBtn"></x><div><img onerror="this.style.visibility = 'hidden'" src="https://lipis.github.io/flag-icon-css/flags/4x3/af.svg"><span class="tagify__tag-text">Afghanistan</span></div></tag>`,
              originalInputValue = await page.$eval(elmSelectors.countries.firstTag, el => el.outerHTML);

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

    // default is: settings.dropdown.enabled = 2
    it("should show dropdown suggestions after 2 typed characters", async () => {
        await page.waitForSelector(elmSelectors.tagify.firstTag);

        const input = await page.$(elmSelectors.tagify.input);
        await input.click({ clickCount: 3 })

        await page.type(elmSelectors.tagify.input, "j");

        let expected = `<div value="Java" class="tagify__dropdown__item " tabindex="0" role="menuitem" aria-labelledby="dropdown-label">Java</div>`;
        let dropdownItemsHTML = await page.$(".tagify__dropdown");
        expect(dropdownItemsHTML).toBeNull();


        await page.type(elmSelectors.tagify.input, "a");

       //  setTimeout(async () => {
            dropdownItemsHTML = await page.$eval(".tagify__dropdown", el => el.innerHTML);
            expect(dropdownItemsHTML).toEqual(expected);
      //  }, 200);

        await page.keyboard.press('ArrowDown');
        expected = `<div value="Java" class="tagify__dropdown__item tagify__dropdown__item--active" tabindex="0" role="menuitem" aria-labelledby="dropdown-label" aria-selected="true">Java</div>`;
        dropdownItemsHTML = await page.$eval(".tagify__dropdown", el => el.innerHTML);
        expect(dropdownItemsHTML).toEqual(expected);
    }, 0)

    it("should add first dropdown suggestions item to tagify (ArrowDown & ENTER)", async () => {
        await page.waitForSelector(elmSelectors.tagify.firstTag)
        await page.type(elmSelectors.tagify.input, "ja")
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('Enter')

        function getAllTagsTexts(elmSelectors) {
            let data = [];
            document.querySelectorAll(elmSelectors.tagify.scope + ' tag').forEach(el => data.push(el.textContent.trim()))
            return data;
        }

        let texts = await page.evaluate(getAllTagsTexts, elmSelectors);
        console.log( texts  )
        expect(texts).toEqual(["css", "html", "javascript", "Java"]);
    }, 0)

    it("should add first dropdown suggestions item to tagify (Mouse click)", async () => {
        await page.waitForSelector(elmSelectors.tagify.firstTag);
        await input.type("ja");
      //  await page.type(elmSelectors.tagify.input, "ja");
        await page.click('.tagify__dropdown__item', { clickCount:1 });

        function getAllTagsTexts(elmSelectors) {
            let data = [];
            document.querySelectorAll(elmSelectors.tagify.scope + ' tag').forEach(el => data.push(el.textContent.trim()))
            return data;
        }

        let texts = await page.evaluate(getAllTagsTexts, elmSelectors);
        expect(texts).toEqual(["css", "html", "javascript", "Java"]);
    }, 0)

    // check events are fired...
})

describe("unit tests", () => {
    describe("dropdown", () => {
        // it("filterListItems('j')", async () => {
        //     await page.waitFor(2000)
        //     await page.waitFor(2000)
        //     await page.waitForSelector(elmSelectors.tagify.firstTag);
        //     expect( xxx.dropdown.filterListItems('j') ).toHaveLength(1);
        // }, 0)
    })
})
