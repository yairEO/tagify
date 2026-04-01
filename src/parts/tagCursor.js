/**
 * TagCursor plugin for Tagify
 *
 * Provides a "tag cursor" that allows the user to navigate between tags using
 * the left and right arrow keys, and to insert or delete tags at the caret
 * position using Enter, Backspace, and Delete.
 *
 */
export default class TagCursor {
    /**
     * @param {object} tagify - The Tagify instance.
     */
    constructor(tagify) {
        this.tagify = tagify
        this._rafId = null // for scheduled scrollIntoView
        this._endAnchor = tagify.DOM.input.nextSibling
    }

    // ─── Index helpers ────────────────────────────────────────────────────────

    /** @returns {number|null} */
    get index() {
        return this.tagify.state.tagCursorIndex
    }

    /**
     * Sets the tag cursor index on Tagify state and re-renders.
     * Pass null to deactivate (input returns to its default end position).
     * @param {number|null} value
     */
    set index(value) {
        const { tagify } = this
        if (!tagify.DOM) return

        const len = tagify.value.length

        if (value === null) {
            tagify.state.tagCursorIndex = null
        } else {
            // Clamp to [0, len]; index === len places the input after the last tag
            tagify.state.tagCursorIndex = Math.max(0, Math.min(len, value))
        }

        this.render()
    }

    // ─── Movement ─────────────────────────────────────────────────────────────

    /**
     * Move the caret one position to the left.
     * Deactivates (returns input to end of field) when the caret would move past
     * the first tag (index < 0).  Deactivates immediately if there are no tags.
     */
    moveLeft() {
        if (this.index === null) return

        if (!this.tagify.value.length) {
            this._deactivate()
            return
        }

        this.index = this.index - 1
    }

    /**
     * Move the caret one position to the right.
     * Deactivates (returns input to end of field) when the caret moves past the
     * last tag (index > tags.length).  Deactivates immediately if there are no tags.
     */
    moveRight() {
        if (this.index === null) return

        if (!this.tagify.value.length) {
            this._deactivate()
            return
        }

        // When advancing would reach or pass the end, exit navigation entirely
        // and return the input to its default end position.
        if (this.index + 1 >= this.tagify.value.length) {
            this._deactivate()
            return
        }

        this.index = this.index + 1
    }

    // ─── Tag operations ───────────────────────────────────────────────────────

    /**
     * Insert a tag at the current tag cursor position.
     * The caller is responsible for providing valid tagData.
     * After insertion the caret advances by one so it sits after the new tag.
     *
     * @param {object} tagData - Tag data object (same shape as Tagify tag data).
     */
    insertAtIndex(tagData) {
        if (this.index === null) return

        const { tagify } = this
        if (!tagify.DOM) return

        const idx = this.index
        const tagElm = tagify.createTagElem(tagData)
        if (!tagElm) {
            console.warn('[Tagify] tagCursor.insertAtIndex: createTagElem returned nothing for', tagData)
            return
        }

        tagify.DOM.scope.insertBefore(tagElm, tagify.DOM.input)
        tagify.value.splice(idx, 0, tagData)

        tagify.state.tagCursorIndex = idx + 1
        this.render()
    }

    /**
     * Delete the tag immediately to the left of the caret (like Backspace).
     * Does nothing when the caret is at position 0 or when index is null.
     * Deactivates and returns focus to the input when the last tag is removed.
     */
    async deleteLeft() {
        if (!this.index) return

        const targetIdx = this.index - 1
        const removed = await this._removeTagAt(targetIdx)
        if (removed === false) return

        if (!this.tagify.value.length) {
            this._deactivate()
            return
        }

        this.tagify.state.tagCursorIndex = targetIdx
        this.render()
    }

    /**
     * Delete the tag immediately to the right of the caret (like Delete).
     * Does nothing when the caret is already past the last tag or null.
     * Deactivates and returns focus to the input when the last tag is removed.
     */
    async deleteRight() {
        const { tagify } = this
        if (this.index === null || this.index >= tagify.value.length) return

        const idx = this.index
        const removed = await this._removeTagAt(idx)
        if (removed === false) return

        if (!tagify.value.length) {
            this._deactivate()
            return
        }

        tagify.state.tagCursorIndex = Math.min(idx, tagify.value.length)
        this.render()
    }

    // ─── Rendering ────────────────────────────────────────────────────────────

    /**
     * Move the real input element to reflect the current index.
     *
     * When index is null (or equals tags.length), the input is placed back in
     * its default end-of-scope position (before the trailing anchor node).
     * Otherwise it is moved to sit before the tag at `index`.
     */
    render() {
        const { tagify } = this
        if (!tagify.DOM) return

        const inputElm = tagify.DOM.input
        const tagNodes = this._getTagNodes()
        const isActive = this.index !== null

        // Determine the node that should come after the input: either the tag at the
        // current index, or the end anchor if the index is at the end or null.
        const refNode = (isActive && tagNodes[this.index])
            ? tagNodes[this.index]
            : (this._endAnchor || null)

        if (inputElm.nextSibling !== refNode) {
            tagify.DOM.scope.insertBefore(inputElm, refNode)
        }

        inputElm.classList.toggle('tagify__input--caret', isActive)

        if (isActive) {
            inputElm.focus()
            this._scheduleScroll()
        }
    }

    /**
     * Remove the tag cursor and reset state to null.
     */
    destroy() {
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId)
            this._rafId = null
        }
        this.tagify.state.tagCursorIndex = null

        const { DOM } = this.tagify
        if (DOM) {
            DOM.input.classList.remove('tagify__input--caret')
            DOM.scope.insertBefore(DOM.input, this._endAnchor || null)
        }
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    /**
     * Deactivate the tag cursor and return focus to the real input.
     * Used when there are no more tags to navigate, or when the last tag is
     * removed while the caret is active.
     */
    _deactivate() {
        const { tagify } = this
        if (!tagify.DOM) return
        tagify.state.tagCursorIndex = null
        tagify.DOM.input.classList.remove('tagify__input--caret')

        tagify.DOM.scope.insertBefore(tagify.DOM.input, this._endAnchor || null)
        tagify.DOM.input.focus()
    }

    /**
     * Schedule a scrollIntoView on the input element in the next animation frame.
     * Used to ensure the active tag and input are visible when navigating with
     * the keyboard.
     */
    _scheduleScroll() {
        if (this._rafId !== null) cancelAnimationFrame(this._rafId)
        this._rafId = requestAnimationFrame(() => {
            this._rafId = null
            this._scrollIntoView()
        })
    }

    /**
     * Ensure the input element is visible inside its scroll container.
     *
     * Strategy:
     *   1. Walk up the DOM to find the nearest element that actually scrolls
     *      horizontally (overflow-x scroll/auto with scrollable content).
     *   2. Nudge its scrollLeft so the input is fully visible, with a small
     *      padding so it does not sit flush against the edge.
     *   3. Fall back to the standard scrollIntoView API for any remaining
     *      visibility concerns (vertical scroll, nested scroll contexts, etc.).
     */
    _scrollIntoView() {
        const el = this.tagify.DOM.input
        if (!el || !el.parentNode) return

        const PADDING = 8  // px of padding on either side when nudging scrollLeft

        // ── 1. find nearest horizontal scroll container ──────────────────────
        let container = el.parentElement
        while (container && container !== document.documentElement) {
            const { overflowX } = getComputedStyle(container)
            const scrollable = overflowX === 'auto' || overflowX === 'scroll'
            if (scrollable && container.scrollWidth > container.clientWidth) break
            container = container.parentElement
        }

        // ── 2. manual horizontal nudge ───────────────────────────────────────
        if (container && container !== document.documentElement) {
            const cRect = el.getBoundingClientRect()
            const pRect = container.getBoundingClientRect()

            if (cRect.right + PADDING > pRect.right) {
                container.scrollLeft += cRect.right + PADDING - pRect.right
            } else if (cRect.left - PADDING < pRect.left) {
                container.scrollLeft -= pRect.left - cRect.left + PADDING
            }
        }

        // ── 3. native fallback for vertical / nested contexts ────────────────
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }

    /** @returns {HTMLElement[]} */
    _getTagNodes() {
        return this.tagify.getTagElms()
    }

    /**
     * Remove the tag at the given value-array index via Tagify's own removal
     * path so events and hooks fire correctly.
     * @param {number} idx
     */
    _removeTagAt(idx) {
        const { tagify } = this
        const tagNodes = this._getTagNodes()
        const tagElm = tagNodes[idx]
        if (!tagElm) {
            console.warn(`[Tagify] tagCursor._removeTagAt: no tag node at index ${idx} (DOM has ${tagNodes.length} tags, value has ${tagify.value.length})`)
            return false
        }
        return tagify.removeTags(tagElm)
    }
}

/**
 * Attaches the TagCursor plugin when enabled; registers a 'remove' listener
 * to deactivate the caret when all tags are gone.
 */
export function initTagCursor() {
    if (this.settings.tagCursor?.enabled) {
        this.tagCursor = new TagCursor(this)

        // When tags are removed externally (e.g. by clicking the "x" button), if the
        // tag cursor is active and there are no more tags left, deactivate the cursor so
        // the input returns to its default end position.
        this.on('remove', () => {
            if (this.tagCursor && this.state.tagCursorIndex !== null && !this.value.length)
                this.tagCursor._deactivate()
        })
    }
}