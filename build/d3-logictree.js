// https://github.com/tomowang/d3-logictree#readme Version 0.0.1. Copyright 2016 Tomo Wang.
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.d3 = global.d3 || {}, global.d3.logictree = global.d3.logictree || {})));
}(this, (function (exports) { 'use strict';

/**
 * tree object has following field
 *  - operator: AND/OR
 *  - left
 *  - right
 */
function Node(data) {
  this.reset();
  if (data === null) {
    this.isNull = true;
    return;
  }
  this.data = data;
  if (data.hasOwnProperty('operator')) {
    this.isLeaf = false;
    this.operator = data.operator;
    this.left = new Node(data.left);
    this.right = new Node(data.right);
    this.left.direction = "left";
    this.right.direction = "right";
    this.left.parent = this.right.parent = this;
  }
}

Node.prototype.reset = function () {
  this.data = null;
  this.parent = null;
  this.isLeaf = true;
  this.operator = null;
  this.left = null;
  this.right = null;
  this.direction = null;
  if (this.point) {
    delete this.x;
    delete this.y;
    delete this.point;
  }
};
Node.prototype.each = function (callback) {
  var node = this, current, next = [node];
  do {
    current = next.reverse();
    next = [];
    while (node = current.pop()) {
      if (node.isLeaf) {
        if (callback(node) === false) {
          next = [];
          break;
        }
      } else {
        next.push(node.left);
        next.push(node.right);
      }
    }
  } while (next.length);
  return this;
};
Node.prototype.descendants = function () {
  var nodes = [];
  this.each(function (node) {
    nodes.push(node);
  });
  return nodes;
};
Node.prototype.opposite = function (orientation) {
  return { left: "right", right: "left" }[orientation];
};

/**
 * merge leaf node with {value} to current node
 */
Node.prototype.merge = function (operator, value, orientation) {
  if (!this.isLeaf) return;
  var node = { operator: operator };
  if (!orientation) orientation = "right";
  node[orientation] = value;
  node[this.opposite(orientation)] = this.data;
  var n = new Node(node);
  if (this.parent === null) {
    Node.call(this, n.data);
  } else {
    n.parent = this.parent;
    this.parent[this.direction] = n;
  }
};

/**
 * remove current node from original tree
 */
Node.prototype.remove = function () {
  if (!this.isLeaf) return;
  if (this.parent === null) {
    Node.call(this, null);
  } else {
    var orientation = this.direction;
    var grandparent = this.parent.parent;
    var grandOrientation = this.parent.direction;
    var oppositeData = this.parent[this.opposite(orientation)].data;
    if (grandparent === null) {
      Node.call(this.parent, oppositeData);
    } else {
      var oppositeNode = new Node(oppositeData);
      oppositeNode.direction = grandOrientation;
      oppositeNode.parent = grandparent;
      grandparent[grandOrientation] = oppositeNode;
    }
  }
};

function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.add = function (p) {
  return new Point(this.x + p.x, this.y + p.y);
};
Point.prototype.subtract = function (p) {
  return new Point(this.x - p.x, this.y - p.y);
};
Point.max = function (p1, p2) {
  return new Point(Math.max(p1.x, p2.x), Math.max(p1.y, p2.y));
};
Point.prototype.equals = function (p) {
  return this.x === p.x && this.y === p.y;
};

function LogicTreeLayout(r, w, h) {
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

exports.Node = Node;
exports.Point = Point;
exports.LogicTreeLayout = LogicTreeLayout;

Object.defineProperty(exports, '__esModule', { value: true });

})));
