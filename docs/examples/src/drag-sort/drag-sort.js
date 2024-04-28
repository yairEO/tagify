var input = document.querySelector('input[name=drag-sort]'),
    tagify = new Tagify(input);

// using 3-party script "dragsort"
// https://github.com/yairEO/dragsort
var dragsort = new DragSort(tagify.DOM.scope, {
    selector:'.' + tagify.settings.classNames.tag,
    callbacks: {
        dragEnd: onDragEnd
    }
})

function onDragEnd(elm){
    tagify.updateValueByDOMTags()
}