import Point from "./point";

export default function LogicTreeLayout(r, w, h) {
    return this
        .attr('radius', r)
        .attr('w', w)
        .attr('h', h);
}

LogicTreeLayout.prototype.attr = function (k, v) {
    if (typeof v === 'undefined') {
        return this[k];
    } else {
        this[k] = v;
        if (k === 'radius') {
            this.diameter = v * 2;
            this.d = new Point(v * 2, 0);
            this.r = new Point(v, 0);
        }
        return this;
    }
};
LogicTreeLayout.prototype.position = function (t) {
    if (t.isNull) return;
    var self = this;
    var treeWidth = this.width(t), treeHeight = this.height(t);
    var start = new Point((self.w - treeWidth) / 2, (self.h - treeHeight) / 2);
    function _position(t, point) {
        if (t.isLeaf) {
            t.x = point.x;
            t.y = point.y;
            t.point = point;
            return;
        }
        if (t.operator === 'AND') {
            _position(t.left, point);
            _position(t.right, point.add(new Point(self.width(t.left), 0)));
        } else if (t.operator === 'OR') {
            _position(t.left, point.add(self.d));
            _position(t.right, point.add(new Point(self.diameter, self.height(t.left))));
        }
    }
    _position(t, start);
};
LogicTreeLayout.prototype.width = function (t) {
    if (t.isNull) return;
    if (t.isLeaf) {
        return this.diameter * 2;
    }
    if (t.operator === 'AND') {
        return this.width(t.left) + this.width(t.right);
    } else if (t.operator === 'OR') {
        return Math.max(this.width(t.left), this.width(t.right)) + this.diameter * 2;
    }
};
LogicTreeLayout.prototype.height = function (t) {
    if (t.isNull) return;
    if (t.isLeaf) {
        return this.diameter * 2;
    }
    if (t.operator === 'OR') {
        return this.height(t.left) + this.height(t.right);
    } else if (t.operator === 'AND') {
        return Math.max(this.height(t.left), this.height(t.right));
    }
};
LogicTreeLayout.prototype.lines = function (t) {
    if (t.isNull) return;
    var treeWidth = this.width(t), treeHeight = this.height(t);
    var links = [], self = this,
        point = new Point((self.w - treeWidth) / 2, (self.h - treeHeight) / 2);
    function _link(node, point) {
        if (node.isLeaf) {
            links.push([node.point.subtract(self.r), node.point.subtract(self.d)]);
            links.push([node.point.add(self.r), node.point.add(self.d)]);
            return [node.point.subtract(self.d), node.point.add(self.d)];
        }
        var pLeft, pRight;
        if (node.operator === 'AND') {
            pLeft = _link(node.left, point);
            pRight = _link(node.right, point.add(new Point(self.width(node.left), 0)));
            return [pLeft[0], pRight[1]];
        } else if (node.operator === 'OR') {
            pLeft = _link(node.left, point.add(self.d));
            pRight = _link(node.right, point.add(new Point(self.diameter, self.height(node.left))));
            var rightBottom = Point.max(pRight[1], pLeft[1]);
            var right = new Point(rightBottom.x, pLeft[1].y);
            if (!right.equals(pLeft[1])) {
                links.push([pLeft[1], right]);
            }
            if (!rightBottom.equals(pRight[1])) {
                links.push([pRight[1], rightBottom]);
            }
            links.push([pRight[0], pRight[0].subtract(self.r), pLeft[0].subtract(self.r)]);
            links.push([rightBottom, rightBottom.add(self.r), right.add(self.r)]);
            links.push([pLeft[0].subtract(self.d), pLeft[0]]);
            links.push([right.add(self.d), right]);
            return [pLeft[0].subtract(self.d), right.add(self.d)];
        }
    }
    _link(t, point);
    return links;
};
