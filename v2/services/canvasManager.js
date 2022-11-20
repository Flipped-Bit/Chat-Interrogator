const boundary = { x1: 0, x2: 1000, y1: 0, y2: 1000 };
var element = { child: { item: undefined, transform: undefined }, item: undefined, transform: undefined };

var max = { x: 0, y: 0 };
var min = { x: 0, y: 0 };

var bbox, confined, offset;

function getMousePosition(evt) {
    var CTM = document.getElementById("canvas").getScreenCTM();
    if (evt.touches) {
        evt = evt.touches[0];
    }
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
    };
}

function startDrag(evt) {
    if (evt.target.classList.contains("draggable")) {
        element.item = evt.target;

        element.transform = getTransfromForItem(
            element.item,
            element.transform
        );

        element.child.transform = (element.item.tagName == "path") ?
            getTransfromForItem(element.item.nextElementSibling, element.child.transform) : undefined;

        offset = getMousePosition(evt);

        offset.x -= element.transform.matrix.e;
        offset.y -= element.transform.matrix.f;

        confined = evt.target.classList.contains("confine");
        if (confined) {
            bbox = element.item.getBBox();
            min.x = boundary.x1 - bbox.x;
            max.x = boundary.x2 - bbox.x - bbox.width;
            min.y = boundary.y1 - bbox.y;
            max.y = boundary.y2 - bbox.y - bbox.height;
        }
    }
}

function drag(evt) {
    if (element.item) {
        evt.preventDefault();

        var coord = getMousePosition(evt);
        var dx = coord.x - offset.x;
        var dy = coord.y - offset.y;

        if (confined) {
            if (dx < min.x) {
                dx = min.x;
            } else if (dx > max.x) {
                dx = max.x;
            }
            if (dy < min.y) {
                dy = min.y;
            } else if (dy > max.y) {
                dy = max.y;
            }
        }

        element.transform.setTranslate(dx, dy);
        if (element.child.transform != undefined) {
            element.child.transform.setTranslate(dx, dy);
        }
    }
}

function endDrag(evt) {
    element.item = false;
    element.child.item = false;
}

function getTransfromForItem(item, itemTransform) {

    if (item.transform === undefined) {
        item.transform = element.transform;
    }

    // Make sure the first transform on the element is a translate transform
    var transforms = item.transform.baseVal;

    if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
        var translate = document.getElementById("canvas").createSVGTransform();
        translate.setTranslate(0, 0);
        item.transform.baseVal.insertItemBefore(translate, 0);
    }

    // Get initial translation
    itemTransform = transforms.getItem(0);

    return itemTransform;
}

module.exports = {
    drag,
    endDrag,
    startDrag
}