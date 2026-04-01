import { test, expect } from '@playwright/test'
import path from 'path'

const baseURL = 'file://' + path.resolve(__dirname, '../docs/examples/dist/tag-cursor.html')

async function setup(page, tagValues = ['tag1', 'tag2', 'tag3']) {
    await page.evaluate((tags) => {
        document.body.innerHTML = `<input name='test' value='${tags.join(',')}'>`
        const input = document.querySelector('input')
        window.tagify = new Tagify(input, { tagCursor: { enabled: true } })
    }, tagValues)
}

const getCaretIdx = (page) =>
    page.evaluate(() => window.tagify.state.tagCursorIndex)

const getValueLen = (page) =>
    page.evaluate(() => window.tagify.value.length)

const getValues = (page) =>
    page.evaluate(() => window.tagify.value.map(t => t.value))

const activateCaret = (page, idx) =>
    page.evaluate((i) => {
        window.tagify.state.tagCursorIndex = i
        window.tagify.tagCursor.render()
    }, idx)

const focusInput = (page) =>
    page.evaluate(() => window.tagify.DOM.input.focus())

test.describe('TagCursor', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto(baseURL)
    })

    test.describe('arrow navigation', () => {

        test('ArrowLeft on empty input activates caret at last position', async ({ page }) => {
            await setup(page)
            await focusInput(page)
            await page.evaluate(() => { window.tagify.DOM.input.textContent = '' })
            await page.keyboard.press('ArrowLeft')
            const idx = await getCaretIdx(page)
            expect(idx).toBe(2)
        })

        test('ArrowLeft on non-empty input does not activate caret', async ({ page }) => {
            await setup(page)
            await focusInput(page)
            await page.evaluate(() => { window.tagify.DOM.input.textContent = 'abc' })
            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBeNull()
        })

        test('ArrowLeft moves caret left one step', async ({ page }) => {
            await setup(page)
            await activateCaret(page, 2)
            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBe(1)
        })

        test('ArrowLeft does not go below 0', async ({ page }) => {
            await setup(page)
            await activateCaret(page, 0)
            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBe(0)
        })

        test('ArrowRight moves caret right one step', async ({ page }) => {
            await setup(page)
            await activateCaret(page, 1)
            await page.keyboard.press('ArrowRight')
            expect(await getCaretIdx(page)).toBe(2)
        })

        test('ArrowRight at end deactivates caret and returns input to end', async ({ page }) => {
            await setup(page)
            await activateCaret(page, 3)
            await page.keyboard.press('ArrowRight')
            expect(await getCaretIdx(page)).toBeNull()
            const isInputFocused = await page.evaluate(
                () => document.activeElement === window.tagify.DOM.input
            )
            expect(isInputFocused).toBe(true)
        })

        test('full left-to-right traversal across all tags', async ({ page }) => {
            await setup(page, ['a', 'b', 'c'])
            await activateCaret(page, 0)

            await page.keyboard.press('ArrowRight')
            expect(await getCaretIdx(page)).toBe(1)
            await page.keyboard.press('ArrowRight')
            expect(await getCaretIdx(page)).toBe(2)
            await page.keyboard.press('ArrowRight')
            expect(await getCaretIdx(page)).toBeNull()
        })

        test('full right-to-left traversal', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await page.evaluate(() => { window.tagify.DOM.input.textContent = '' })
            await focusInput(page)

            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBe(1)
            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBe(0)
            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBe(0)
        })

        test('navigation with single tag', async ({ page }) => {
            await setup(page, ['only'])
            await page.evaluate(() => { window.tagify.DOM.input.textContent = '' })
            await focusInput(page)
            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBe(0)
            await page.keyboard.press('ArrowRight')
            expect(await getCaretIdx(page)).toBeNull()
        })

        test('navigation with no tags does not activate caret', async ({ page }) => {
            await setup(page, [])
            await page.evaluate(() => { window.tagify.DOM.input.textContent = '' })
            await focusInput(page)
            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBeNull()
        })

        test('rapid ArrowLeft presses stay >= 0', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 2)
            for (let i = 0; i < 10; i++) {
                await page.keyboard.press('ArrowLeft')
            }
            expect(await getCaretIdx(page)).toBe(0)
        })
    })

    test.describe('insert at caret position', () => {

        test('tag added via Enter is inserted at caret position', async ({ page }) => {
            await setup(page, ['tag1', 'tag2'])
            await activateCaret(page, 1)

            await page.evaluate(() => {
                window.tagify.addTags([{ value: 'inserted', __isValid: true }])
            })

            const values = await getValues(page)
            expect(values[1]).toBe('inserted')
            expect(values[2]).toBe('tag2')
        })

        test('caret advances after insertion', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 1)
            await page.evaluate(() => {
                window.tagify.addTags([{ value: 'new', __isValid: true }])
            })
            expect(await getCaretIdx(page)).toBe(2)
        })

        test('insert at index 0 prepends tag', async ({ page }) => {
            await setup(page, ['second'])
            await activateCaret(page, 0)
            await page.evaluate(() => {
                window.tagify.addTags([{ value: 'first', __isValid: true }])
            })
            const values = await getValues(page)
            expect(values[0]).toBe('first')
            expect(values[1]).toBe('second')
        })

        test('insert at end appends tag', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 2)
            await page.evaluate(() => {
                window.tagify.addTags([{ value: 'c', __isValid: true }])
            })
            const values = await getValues(page)
            expect(values).toEqual(['a', 'b', 'c'])
        })

        test('null caret appends tag as normal', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await page.evaluate(() => {
                window.tagify.addTags([{ value: 'c', __isValid: true }])
            })
            expect(await getCaretIdx(page)).toBeNull()
            const values = await getValues(page)
            expect(values[2]).toBe('c')
        })

        test('typing then Enter inserts tag at caret position', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 1)
            await focusInput(page)

            await page.keyboard.type('mid')
            expect(await getCaretIdx(page)).toBe(1)
            await page.keyboard.press('Enter')

            const values = await getValues(page)
            expect(values[0]).toBe('a')
            expect(values[1]).toBe('mid')
            expect(values[2]).toBe('b')
        })
    })

    test.describe('backspace', () => {

        test('Backspace removes tag to the left when input is empty', async ({ page }) => {
            await setup(page, ['a', 'b', 'c'])
            await activateCaret(page, 2)
            await page.keyboard.press('Backspace')
            const values = await getValues(page)
            expect(values).toEqual(['a', 'c'])
            expect(await getCaretIdx(page)).toBe(1)
        })

        test('Backspace with typed text deletes a character, not a tag', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 1)
            await focusInput(page)
            await page.keyboard.type('xy')
            await page.keyboard.press('Backspace')
            expect(await getValueLen(page)).toBe(2)
            expect(await getCaretIdx(page)).toBe(1)
            const inputText = await page.evaluate(() => window.tagify.DOM.input.textContent)
            expect(inputText).toBe('x')
        })

        test('Backspace at position 0 does nothing', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 0)
            await page.keyboard.press('Backspace')
            expect(await getValueLen(page)).toBe(2)
            expect(await getCaretIdx(page)).toBe(0)
        })

        test('Backspace on last tag deactivates caret and focuses input', async ({ page }) => {
            await setup(page, ['only'])
            await activateCaret(page, 1)
            await page.keyboard.press('Backspace')
            expect(await getValueLen(page)).toBe(0)
            expect(await getCaretIdx(page)).toBeNull()
            const isInputFocused = await page.evaluate(
                () => document.activeElement === window.tagify.DOM.input
            )
            expect(isInputFocused).toBe(true)
        })

        test('Delete removes tag to the right when input is empty', async ({ page }) => {
            await setup(page, ['a', 'b', 'c'])
            await activateCaret(page, 1)
            await page.keyboard.press('Delete')
            const values = await getValues(page)
            expect(values).toEqual(['a', 'c'])
            expect(await getCaretIdx(page)).toBe(1)
        })

        test('Delete with typed text deletes a character, not a tag', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 1)
            await focusInput(page)
            await page.keyboard.type('xy')
            await page.evaluate(() => {
                const input = window.tagify.DOM.input
                const range = document.createRange()
                range.setStart(input.firstChild || input, 0)
                range.collapse(true)
                const sel = window.getSelection()
                sel.removeAllRanges()
                sel.addRange(range)
            })
            await page.keyboard.press('Delete')
            expect(await getValueLen(page)).toBe(2)
            expect(await getCaretIdx(page)).toBe(1)
        })

        test('Delete at end does nothing', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 2)
            await page.keyboard.press('Delete')
            expect(await getValueLen(page)).toBe(2)
            expect(await getCaretIdx(page)).toBe(2)
        })

        test('Delete on last tag deactivates caret', async ({ page }) => {
            await setup(page, ['only'])
            await activateCaret(page, 0)
            await page.keyboard.press('Delete')
            expect(await getValueLen(page)).toBe(0)
            expect(await getCaretIdx(page)).toBeNull()
        })

        test('Backspace without caret keeps default Tagify behaviour', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await focusInput(page)
            await page.keyboard.press('Backspace')
            expect(await getCaretIdx(page)).toBeNull()
            expect(await getValueLen(page)).toBe(1)
        })

        test('rapid Backspace stops at 0 tags and deactivates', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 2)
            await page.keyboard.press('Backspace')
            await page.keyboard.press('Backspace')
            await page.keyboard.press('Backspace')
            expect(await getValueLen(page)).toBe(0)
            expect(await getCaretIdx(page)).toBeNull()
        })
    })

    test.describe('transition input ↔ caret', () => {

        test('typing keeps caret active', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 1)
            await focusInput(page)
            await page.evaluate(() => {
                window.tagify.DOM.input.textContent = 'x'
                window.tagify.DOM.input.dispatchEvent(new Event('input', { bubbles: true }))
            })
            expect(await getCaretIdx(page)).toBe(1)
        })

        test('activating caret keeps input focused', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await focusInput(page)

            await page.evaluate(() => {
                window.tagify.tagCursor.index = 1
            })
            const isStillActive = await page.evaluate(() =>
                document.activeElement === window.tagify.DOM.input
            )
            expect(isStillActive).toBe(true)
        })

        test('caret is null after ArrowRight exits navigation', async ({ page }) => {
            await setup(page, ['a'])
            await activateCaret(page, 1)
            await page.keyboard.press('ArrowRight')
            expect(await getCaretIdx(page)).toBeNull()
            const isInputFocused = await page.evaluate(
                () => document.activeElement === window.tagify.DOM.input
            )
            expect(isInputFocused).toBe(true)
        })

        test('Escape while caret active does not crash', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 1)
            await page.keyboard.press('Escape')
            const idx = await getCaretIdx(page)
            expect([null, 0, 1, 2]).toContain(idx)
        })
    })

    test.describe('mouse interaction', () => {

        test('clicking left half of a tag places caret before it', async ({ page }) => {
            await setup(page, ['aaa', 'bbb', 'ccc'])
            const tags = page.locator('.tagify__tag')
            const secondTag = tags.nth(1)
            const box = await secondTag.boundingBox()

            await page.mouse.click(box.x + box.width * 0.25, box.y + box.height / 2)
            expect(await getCaretIdx(page)).toBe(1)
        })

        test('clicking right half of a tag places caret after it', async ({ page }) => {
            await setup(page, ['aaa', 'bbb', 'ccc'])
            const tags = page.locator('.tagify__tag')
            const secondTag = tags.nth(1)
            const box = await secondTag.boundingBox()

            await page.mouse.click(box.x + box.width * 0.55, box.y + box.height / 2)
            expect(await getCaretIdx(page)).toBe(2)
        })

        test('clicking first tag left half → caret at 0', async ({ page }) => {
            await setup(page, ['aaa', 'bbb'])
            const tag = page.locator('.tagify__tag').first()
            const box = await tag.boundingBox()
            await page.mouse.click(box.x + box.width * 0.2, box.y + box.height / 2)
            expect(await getCaretIdx(page)).toBe(0)
        })

        test('clicking last tag right half → caret at tags.length', async ({ page }) => {
            await setup(page, ['aaa', 'bbb'])
            const tags = page.locator('.tagify__tag')
            const lastTag = tags.last()
            const box = await lastTag.boundingBox()
            await page.mouse.click(box.x + box.width * 0.55, box.y + box.height / 2)
            expect(await getCaretIdx(page)).toBe(2)
        })

        test('double-clicking a tag does not activate caret (enters edit mode instead)', async ({ page }) => {
            await setup(page, ['aaa', 'bbb'])
            const tag = page.locator('.tagify__tag').first()
            await tag.dblclick()
            expect(await getCaretIdx(page)).toBeNull()
            const isEditing = await page.evaluate(() => !!window.tagify.state.editing)
            expect(isEditing).toBe(true)
        })

        test('single click on tag then typing keeps caret active', async ({ page }) => {
            await setup(page, ['aaa', 'bbb'])

            await page.evaluate(() => { window.tagify.settings.editTags = 2 })

            const tag = page.locator('.tagify__tag').first()
            const box = await tag.boundingBox()
            await page.mouse.click(box.x + box.width * 0.55, box.y + box.height / 2)

            const idxAfterClick = await getCaretIdx(page)
            expect(idxAfterClick).not.toBeNull()

            await page.evaluate(() => {
                window.tagify.DOM.input.textContent = 'z'
                window.tagify.DOM.input.dispatchEvent(new Event('input', { bubbles: true }))
            })
            expect(await getCaretIdx(page)).toBe(idxAfterClick)
        })
    })

    test.describe('edge cases', () => {

        test('state is always null / 0 / positive integer — never negative', async ({ page }) => {
            await setup(page, ['a'])
            await activateCaret(page, 0)
            for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft')
            const idx = await getCaretIdx(page)
            expect(idx === null || idx >= 0).toBe(true)
        })

        test('state never exceeds value.length', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 2)
            for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
            const idx     = await getCaretIdx(page)
            const valLen  = await getValueLen(page)
            expect(idx === null || idx <= valLen).toBe(true)
        })

        test('removing all tags via X buttons deactivates caret', async ({ page }) => {
            await setup(page, ['only'])
            await activateCaret(page, 0)
            await page.locator('.tagify__tag__removeBtn').click()
            expect(await getValueLen(page)).toBe(0)
            expect(await getCaretIdx(page)).toBe(0)
        })

        test('tagCursorIndex stays null across add/remove when not activated', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await page.evaluate(() => window.tagify.addTags(['c']))
            await page.evaluate(() => window.tagify.removeTags(window.tagify.getTagElms()[0]))
            expect(await getCaretIdx(page)).toBeNull()
        })

        test('index setter clamps when value shrinks mid-navigation', async ({ page }) => {
            await setup(page, ['a', 'b', 'c'])
            await activateCaret(page, 3)

            await page.evaluate(() => {
                window.tagify.removeTags(window.tagify.getTagElms()[0])
            })

            await page.evaluate(() => { window.tagify.tagCursor.index = 3 })
            const idx    = await getCaretIdx(page)
            const valLen = await getValueLen(page)
            expect(idx).toBeLessThanOrEqual(valLen)
        })

        test('input has tagify__input--caret class when active, not when null', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 1)
            const hasClass = await page.evaluate(() =>
                window.tagify.DOM.input.classList.contains('tagify__input--caret')
            )
            expect(hasClass).toBe(true)

            await page.evaluate(() => {
                window.tagify.state.tagCursorIndex = null
                window.tagify.tagCursor.render()
            })
            const hasClassAfter = await page.evaluate(() =>
                window.tagify.DOM.input.classList.contains('tagify__input--caret')
            )
            expect(hasClassAfter).toBe(false)
        })

        test('input is physically positioned between tags matching the index', async ({ page }) => {
            await setup(page, ['a', 'b', 'c'])
            await activateCaret(page, 1)

            const isCorrectlyPositioned = await page.evaluate(() => {
                const scope = window.tagify.DOM.scope
                const input = window.tagify.DOM.input
                const children = Array.from(scope.children)
                const inputPos = children.indexOf(input)
                const tags = window.tagify.getTagElms()
                return children.indexOf(tags[0]) < inputPos &&
                       inputPos < children.indexOf(tags[1])
            })
            expect(isCorrectlyPositioned).toBe(true)
        })

        test('destroy() while caret is active resets state and repositions input', async ({ page }) => {
            await setup(page, ['a', 'b', 'c'])
            await activateCaret(page, 1)

            await page.evaluate(() => window.tagify.destroy())

            const result = await page.evaluate(() => ({
                cursorGone : !window.tagify.tagCursor,
                idxNull    : window.tagify.state.tagCursorIndex === null,
                noCaretClass: !window.tagify.DOM?.input?.classList.contains('tagify__input--caret'),
            }))
            expect(result.cursorGone).toBe(true)
            expect(result.idxNull).toBe(true)
            expect(result.noCaretClass).toBe(true)
        })

        test('X-button removes tag when tagCursor is enabled but caret is inactive (null index)', async ({ page }) => {
            await setup(page, ['a', 'b', 'c'])
            expect(await getCaretIdx(page)).toBeNull()

            await page.locator('.tagify__tag__removeBtn').first().click()
            expect(await getValueLen(page)).toBe(2)
            expect(await getCaretIdx(page)).toBeNull()
        })

        test('double-click from active caret repositions input to end-of-scope', async ({ page }) => {
            await setup(page, ['a', 'b'])
            await activateCaret(page, 1)

            await page.locator('.tagify__tag').first().dblclick()

            expect(await getCaretIdx(page)).toBeNull()
            const hasCaretClass = await page.evaluate(() =>
                window.tagify.DOM.input.classList.contains('tagify__input--caret')
            )
            expect(hasCaretClass).toBe(false)

            const isAtEnd = await page.evaluate(() => {
                const scope = window.tagify.DOM.scope
                const input = window.tagify.DOM.input
                const tags  = window.tagify.getTagElms()
                const children = Array.from(scope.children)
                return tags.every(t => children.indexOf(t) < children.indexOf(input))
            })
            expect(isAtEnd).toBe(true)
        })
    })

    test.describe('tagCursor disabled (smoke)', () => {

        test('ArrowLeft with feature disabled does not activate caret', async ({ page }) => {
            await page.evaluate(() => {
                document.body.innerHTML = `<input name='test' value='a,b,c'>`
                window.tagify = new Tagify(document.querySelector('input'))
            })
            await page.evaluate(() => window.tagify.DOM.input.textContent = '')
            await page.evaluate(() => window.tagify.DOM.input.focus())
            await page.keyboard.press('ArrowLeft')
            expect(await getCaretIdx(page)).toBeNull()
        })

        test('Backspace with feature disabled removes last tag', async ({ page }) => {
            await page.evaluate(() => {
                document.body.innerHTML = `<input name='test' value='a,b'>`
                window.tagify = new Tagify(document.querySelector('input'))
            })
            await page.evaluate(() => window.tagify.DOM.input.focus())
            await page.keyboard.press('Backspace')
            expect(await getCaretIdx(page)).toBeNull()
            expect(await getValueLen(page)).toBe(1)
        })

        test('tagCursor property is not attached when disabled', async ({ page }) => {
            await page.evaluate(() => {
                document.body.innerHTML = `<input name='test'>`
                window.tagify = new Tagify(document.querySelector('input'))
            })
            const hasCursor = await page.evaluate(() => !!window.tagify.tagCursor)
            expect(hasCursor).toBe(false)
        })
    })
})
