import { test, expect } from '@playwright/test'
import defaults from '../src/parts/defaults'

let DOM = {
    origInput: undefined,
    tagify: undefined,
}

const tagifySelectors = Object.entries(defaults.classNames).reduce((acc, [key, value]) => (acc[key] = '.' + value, acc), {})

const getTagNodeText = async loc => {
    let tagTextNode = await loc.locator(tagifySelectors.tagText)
    let tagText = await tagTextNode.textContent()
    return tagText
}

const loadHTML_basic = async (page) => {
    await page.evaluate(() => {
        document.body.innerHTML = "<input name='basic' value='tag1,tag2' autofocus>"

        const input = document.querySelector('input')
        window.tagify = new Tagify(input)
    })
}

const getPageDOM = async (page) => {
    DOM.tagify = await page.locator(tagifySelectors.namespace)
    DOM.origInput = await page.locator('input[value]')
}

//////////////////////////////////////////////////////////////////////
// tests helpers

async function assertHasTags(page, ...expectedTags) {
    const tagChildren = await page.locator('tags > tag');

    // Assert total tag count
    await expect(tagChildren).toHaveCount(expectedTags.length);

    // Iterate through expected tags and assert their title attributes
    for (let i = 0; i < expectedTags.length; i++) {
        const tag = await tagChildren.nth(i)
        await expect(tag).toHaveAttribute('title', expectedTags[i])
        const tagText = await getTagNodeText(tag)
        await expect(tagText).toBe(expectedTags[i])
    }
}



//////////////////////////////////////////////////////////////////////
// actual tests

test.describe('basic', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('file:///C:/Users/vsync/projects/tagify/docs/examples/src/example-template.html')
        await loadHTML_basic(page)
        await getPageDOM(page)
    })

    test('should recieve focus via `autofocus` input attribute', async ({ page }) => {
        // Assertion 2: Check 'autofocus' presence
        await expect(DOM.origInput).toHaveAttribute('autofocus', '')

        // should not have initial focus
        await DOM.tagify.getByRole('textbox').click()
        await expect(DOM.tagify).toHaveClass(`${defaults.classNames.namespace} ${defaults.classNames.focus}`)
    })

    test('should loose focus', async ({ page }) => {
        await DOM.tagify.getByRole('textbox').click()
        await expect(DOM.tagify).toHaveClass(new RegExp(defaults.classNames.focus))
        await page.locator('html').click();
        await expect(DOM.tagify).not.toHaveClass(new RegExp(defaults.classNames.focus))
    })

    test('should have converted the `value` attribute into tags', async ({ page }) => {
        const value = await DOM.origInput.inputValue()
        const origValues = value.split(',')

        await assertHasTags(page, origValues[0], origValues[1])
    })

    test.describe('add tags', () => {
        test('should add tag by typeing and pressing ENTER key', async ({ page }) => {
            const newTagValue = 'foo'

            await DOM.tagify.getByRole('textbox').click()
            await DOM.tagify.getByRole('textbox').fill(newTagValue)
            await page.keyboard.press('Enter')

            await assertHasTags(page, 'tag1', 'tag2', newTagValue)
        })


        test('should add multiple tags by typeing and pressing ENTER key', async ({ page }) => {
            await DOM.tagify.getByRole('textbox').click()
            await DOM.tagify.getByRole('textbox').fill('foo, bar')

            await assertHasTags(page, 'tag1', 'tag2', 'foo', 'bar')
        })

        test('should add tag by typeing and blur out', async ({ page }) => {
            const newTagValue = 'foo'

            await DOM.tagify.getByRole('textbox').click()
            await DOM.tagify.getByRole('textbox').fill(newTagValue)
            await DOM.tagify.getByRole('textbox').blur()

            await assertHasTags(page, 'tag1', 'tag2', newTagValue)
        })

        test('should trim text input when creating a tag', async ({ page }) => {
            await DOM.tagify.getByRole('textbox').click()
            await DOM.tagify.getByRole('textbox').fill(' foo   ')
            await page.keyboard.press('Enter')

            await assertHasTags(page, 'tag1', 'tag2', 'foo')
        })

        test('should not add tags if delimiters key was clicked in an empty input', async ({ page }) => {
            await DOM.tagify.getByRole('textbox').click()
            await DOM.tagify.getByRole('textbox').fill(',')
            await page.keyboard.press('Enter')

            await assertHasTags(page, 'tag1', 'tag2')
        })

        test('should not add tags if delimiters key was clicked in an input with whitespaces', async ({ page }) => {
            await DOM.tagify.getByRole('textbox').click()
            await DOM.tagify.getByRole('textbox').fill('   ,')
            await page.keyboard.press('Enter')

            await assertHasTags(page, 'tag1', 'tag2')
        })

        test.describe('addTags()', () => {
            test('should add one tag', async ({ page }) => {
                await page.evaluate(() => window.tagify.addTags('foo') )
                await assertHasTags(page, 'tag1', 'tag2', 'foo')
            })

            test('should add 2 tags as an array of strings', async ({ page }) => {
                await page.evaluate(() => window.tagify.addTags(['foo', 'bar']) )
                await assertHasTags(page, 'tag1', 'tag2', 'foo', 'bar')
            })

            test('should add 2 tags as an array of numbers', async ({ page }) => {
                await page.evaluate(() => window.tagify.addTags([1, 2]) )
                await assertHasTags(page, 'tag1', 'tag2', '1', '2')
            })

            test('should add 2 tags only if `addTags()` was called with an empty array item', async ({ page }) => {
                await page.evaluate(() => window.tagify.addTags(['foo',, 'bar']) )
                await assertHasTags(page, 'tag1', 'tag2', 'foo', 'bar')
            })

            test('should add 2 tags as array of objects', async ({ page }) => {
                await page.evaluate(() => window.tagify.addTags( [{value: '  foo'}, {value: 'bar   '}]) )
                await assertHasTags(page, 'tag1', 'tag2', 'foo', 'bar')
            })

            test('should not add tags with objects containing empty value, regardless of the "trim" setting', async ({ page }) => {
                await page.evaluate(() => window.tagify.addTags( [{value: '  '}, {value: ''}]) )
                await assertHasTags(page, 'tag1', 'tag2')

                await page.evaluate(() => {
                    window.tagify.settings.trim = false
                    window.tagify.addTags( [{value: '  '}, {value: ''}] )
                })

                await assertHasTags(page, 'tag1', 'tag2')
            })

            test('should add tags with objects containing empty value if "trim" setting is "false"', async ({ page }) => {
                await page.evaluate(() => {
                    window.tagify.settings.trim = false
                    window.tagify.addTags( [{value: '  a'}, {value: 'b  '}])
                })
                await assertHasTags(page, 'tag1', 'tag2', '  a', 'b  ')
            })
        })

        test.describe('max tags', () => {
            test('should not add more tags than allowed', async ({ page }) => {
                await page.evaluate(() => {
                    window.tagify.settings.maxTags = 3
                    window.tagify.addTags(['foo', 'bar'])
                })

                await assertHasTags(page, 'tag1', 'tag2', 'foo')
            })

            test('should not initially create more tags than allowed if maxTags is greater then original value tags count', async ({ page }) => {
                await page.evaluate(() => {
                    document.body.innerHTML = "<input name='basic' value='tag1, tag2, tag3, tag4'>"

                    const input = document.querySelector('input')
                    new Tagify(input, {maxTags: 2})
                })

                await assertHasTags(page, 'tag1', 'tag2')
            })
        })
    })

    test.describe('remove tags', () => {
        test('should remove the first tag by clicking its X button', async ({ page }) => {
            await page.getByTitle('tag1').getByLabel('remove tag').click();
            await assertHasTags(page, 'tag2')
        })

        test('should remove the second tag by clicking its X button', async ({ page }) => {
            await page.getByTitle('tag2').getByLabel('remove tag').click();
            await assertHasTags(page, 'tag1')
        })

        test('should remove a one tag by clicking backspace', async ({ page }) => {
            await DOM.tagify.getByRole('textbox').click()
            await page.keyboard.press('Backspace');
            await assertHasTags(page, 'tag1')
        })

        test('remove all tags', async ({page}) => {
            await page.evaluate(() => window.tagify.removeAllTags() )
            await assertHasTags(page)
        })
    })
})