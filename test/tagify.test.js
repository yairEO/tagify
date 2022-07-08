// const puppeteer = require("puppeteer");
const path = require("path");
const APP = `file:${path.join(__dirname, '/', 'test.html')}`

// let page;
// let browser;
// const width = 1920;
// const height = 1080;

let elmSelectors = {
    tagify : {
        scope         : ".some_class_name",
        input         : ".tagify.some_class_name .tagify__input",
        originalInput : "input.some_class_name",
        firstTag      : ".tagify__tag"
    },

    tagify_textarea : {
        scope         : ".tagify.textarea",
        input         : ".tagify.textarea .tagify__input",
        originalInput : "input.some_class_name",
        tag           : ".tagify__tag"
    },

    mixed : {
        scope         : ".tagify--mix",
        input         : ".tagify--mix .tagify__input",
        firstTag      : ".tagify--mix .tagify__tag",
        originalInput : "[name=mix]",
    },

    countries : {
        scope         : ".countries",
        input         : ".tagify.countries .tagify__input",
        originalInput : "input.countries",
        firstTag      : ".tagify.countries .tagify__tag"
    }

}



beforeAll(async () => {
    // browser = await puppeteer.launch(
    //     {
    //         headless: false,
    //         slowMo  : 80,
    //         args    : [`--window-size = ${width},${height}`]
    //     }
    // )

    // page = await browser.newPage()

    // await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36')
    // await page.setViewport({ width, height })
    await page.goto(APP);
})

afterEach(async () => {
    // clear input text
    const input = await page.$(elmSelectors.tagify.input)
    await input.click({ clickCount: 3 })
    await page.keyboard.press('Backspace')

    await page.evaluate(() => {
        location.reload(true)
    })
})


// afterAll(() => {
//     browser.close();
// })


describe("simple tests", () => {
    // fit("access window object", async () => {
    //     const performance = JSON.parse(await page.evaluate(
    //         () => JSON.stringify( window.tagify__basic )
    //     ))

    //     expect(performance).toEqual(1000)
    // }, 200)

    it("duplicate tags removed", async (done) => {
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

        setTimeout(async ()=> {
            texts = await page.evaluate(getAllTagsTexts, elmSelectors);
            expect(texts).toEqual(["css", "html", "javascript"]);
            done()
        }, 1000)
    }, 0);

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

    it("input JSON array renders 2 tags with correct attributes", async () => {
        await page.waitForSelector('.value_JSON');
        const expected = `<tag title="foo" contenteditable="false" spellcheck="false" class="tagify__tag tagify--noAnim" role="tag" value="foo"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text">foo</span></div></tag><tag title="xxx" contenteditable="false" spellcheck="false" class="tagify__tag tagify--noAnim" role="tag" value="bar"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text">bar</span></div></tag>`

        const getAllTagsHTML = () =>
            [...document.querySelectorAll('.value_JSON tag')]
                .reduce((HTMLtext, el) => HTMLtext += el.outerHTML , "")


        let tagsHTML = await page.evaluate(getAllTagsHTML);
        expect(tagsHTML).toEqual(expected);
    }, 0);

    /*
        * validate tag while typing
        * "autoComplete" settings: if whitelist exists and when typing there was a match, suggested text should be shown (in faded gray)
        * same as above: if pressing "tab" or "right arrow" the suggestion should be set as a new tag
        * smarter "fuzzySearch" autosuggest text: do not fill in the autosuggest if the match isn't from the start!
        * select-mode: if multiple tags were added, ignore all except first and add it
        * when dropdown is open and blur event occured, close it
        * starting to type something that is in the whitelist and then clicking it should select it and remove the suggested text (::after)
        * select mode: arrow down should show the suggestions dropdown
    */
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

describe("edit tag", () => {
    it('should enter "edit-mode" when double-clicking a tag', async () => {
        await page.waitForSelector(elmSelectors.tagify.firstTag);
        await page.click(elmSelectors.tagify.firstTag, { clickCount: 2 });

        let expected = '<tag title="css" contenteditable="false" spellcheck="false" class="tagify__tag tagify--mark tagify--noAnim tagify--editable" role="tag" value="css"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text" contenteditable="true">css</span></div></tag>',
            tagTemplate = await page.$eval(elmSelectors.tagify.firstTag, el => el.outerHTML);

        expect(tagTemplate).toEqual(expected);
    }, 0)

    it('should save edited tag on "Enter" keypress (when there is a value)', async () => {
        await page.waitForSelector(elmSelectors.tagify.firstTag);
        await page.click(elmSelectors.tagify.firstTag, { clickCount: 2 });

        async function getFirstTagText(){
            return await page.$eval(elmSelectors.tagify.firstTag, el => el.querySelector('.tagify__tag-text').textContent);
        }

        let prevTagText = await getFirstTagText();
        let addedText = 'test 123';
        await page.type(elmSelectors.tagify.firstTag + ' .tagify__tag-text', addedText)
        page.keyboard.press('Enter')

        let tagTextContent = await getFirstTagText();
        expect(tagTextContent).toEqual(prevTagText + addedText);
    }, 0)

    it('should save edited tag on blur (when there is a value)', async () => {
        await page.waitForSelector(elmSelectors.tagify.firstTag);
        await page.click(elmSelectors.tagify.firstTag, { clickCount: 2 });

        async function getFirstTagText(){
            return await page.$eval(elmSelectors.tagify.firstTag, el => el.querySelector('.tagify__tag-text').textContent);
        }

        let prevTagText = await getFirstTagText();
        let addedText = 'test 123';
        await page.type(elmSelectors.tagify.firstTag + ' .tagify__tag-text', addedText)
        page.click('body', { clickCount:1 }); // invoke "blur" event

        let tagTextContent = await getFirstTagText();
        expect(tagTextContent).toEqual(prevTagText + addedText);
    }, 0)

    it('should remove edited tag on blur when value is empty', async (done) => {
        var tagsValues;
        await page.waitForSelector(elmSelectors.tagify.firstTag);
        await page.click(elmSelectors.tagify.firstTag, { clickCount: 2 });

        function getAllTagsTexts(elmSelectors) {
            let data = [];
            document.querySelectorAll(elmSelectors.tagify.scope + ' tag').forEach(el => data.push(el.textContent.trim()))
            return data;
        }

        await page.click(elmSelectors.tagify.firstTag, { clickCount: 2 });
        await page.keyboard.press('Backspace')
        page.click('body', { clickCount:1 }); // invoke "blur" event

        setTimeout(async ()=> {
            tagsValues = await page.evaluate(getAllTagsTexts, elmSelectors);
            expect(tagsValues).toEqual(["html", "javascript"]);
            done()
        }, 1000)
    }, 0)

    fit('should enter "edit-mode" on previous tag after hitting the "backspace" key when {backspace:"edit"} setting was set', async () => {
        await page.waitForSelector(elmSelectors.tagify_textarea.scope);

        const input = await page.$(elmSelectors.tagify_textarea.input);
        await input.click({ clickCount: 3 })

        await page.keyboard.press('Backspace')

       //  setTimeout(async () => {
        const lastTagElm = await page.$(".tagify.textarea tag:last-of-type")
        const className = await lastTagElm.getProperty('className')


        expect(className.jsonValue()).toEqual("tagify__tag tagify--editable");
    }, 0)

    it('should revert editing on "esc" keypress', async () => {
        expect(0).toEqual(1)
    }, 0)

    it('should revert editing on "esc" keypress', async () => {
        expect(0).toEqual(1)
    }, 0)
})


describe("suggestions dropdown", () => {
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
        expect(texts).toEqual(["css", "html", "javascript", "Java"]);
    }, 0)

    it("should add first dropdown suggestions item to tagify (Mouse click)", async () => {
        await page.waitForSelector(elmSelectors.tagify.firstTag);
       // await input.type("ja");
        await page.type(elmSelectors.tagify.input, "ja");
        await page.click('.basicDropdown .tagify__dropdown__item', { clickCount:1 });

        function getAllTagsTexts(elmSelectors) {
            let data = [];
            document.querySelectorAll(elmSelectors.tagify.scope + ' tag').forEach(el => data.push(el.textContent.trim()))
            return data;
        }

        let texts = await page.evaluate(getAllTagsTexts, elmSelectors);
        expect(texts).toEqual(["css", "html", "javascript", "Java"]);
    }, 0)

    it('should respect "fuzzySearch" dropdown setting', async () => {
        expect(0).toEqual(1)
    }, 0)

    it('should respect "highlightFirst" dropdown setting', async () => {
        expect(0).toEqual(1)
    }, 0)

    it('should respect "closeOnSelect" dropdown setting', async () => {
        expect(0).toEqual(1)
    }, 0)

    it('should respect "maxItems" dropdown setting', async () => {
        expect(0).toEqual(1)
    }, 0)

    it('should respect "itemTemplate" dropdown setting', async () => {
        expect(0).toEqual(1)
    }, 0)

    it('should respect "classname" dropdown setting', async () => {
        expect(0).toEqual(1)
    }, 0)
})


describe("actions", () => {

    // check events are fired...
})

describe("mixed-mode", () => {
    it("should parse textarea into mixed-tags", async () => {
        await page.waitForSelector(elmSelectors.mixed.originalInput);

        const result = await page.$eval(elmSelectors.mixed.input, el => el.innerHTML);
        const expected = `<tag title="Eric Cartman" contenteditable="false" spellcheck="false" class="tagify__tag borderd-blue" value="cartman"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text">cartman</span></div></tag>⁠ and <tag title="Kyle Broflovski" contenteditable="false" spellcheck="false" class="tagify__tag " value="kyle"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text">kyle</span></div></tag>⁠ do not know <tag title="Homer simpson" contenteditable="false" spellcheck="false" class="tagify__tag " value="Homer simpson"><x title="" class="tagify__tag__removeBtn" role="button" aria-label="remove tag"></x><div><span class="tagify__tag-text">Homer simpson</span></div></tag>⁠ because he's a relic.`

        expect(result).toEqual(expected);
    }, 0)

    it("should update textarea on deleted tag", async (done) => {
        await page.waitForSelector(elmSelectors.mixed.firstTag);
        await page.click(elmSelectors.mixed.firstTag + " .tagify__tag__removeBtn", { clickCount:1 });

        const expectedTagifyInput   = `⁠ and <tag title=\"Kyle Broflovski\" contenteditable=\"false\" spellcheck=\"false\" class=\"tagify__tag \" value=\"kyle\"><x title=\"\" class=\"tagify__tag__removeBtn\" role=\"button\" aria-label=\"remove tag\"></x><div><span class=\"tagify__tag-text\">kyle</span></div></tag>⁠ do not know <tag title=\"Homer simpson\" contenteditable=\"false\" spellcheck=\"false\" class=\"tagify__tag \" value=\"Homer simpson\"><x title=\"\" class=\"tagify__tag__removeBtn\" role=\"button\" aria-label=\"remove tag\"></x><div><span class=\"tagify__tag-text\">Homer simpson</span></div></tag>⁠ because he's a relic.`
        const expectedTextareaValue = `⁠ and [[kyle]]⁠ do not know [[Homer simpson]]⁠ because he's a relic.`

        setTimeout(async ()=>{
            const tagifyInput = await page.$eval(elmSelectors.mixed.input, el => el.innerHTML);
            const textareaValue = await page.$eval(elmSelectors.mixed.originalInput, el => el.value);
            expect(tagifyInput).toEqual(expectedTagifyInput);
            expect(textareaValue).toEqual(expectedTextareaValue);
            done()
        }, 400)
    }, 0)
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
