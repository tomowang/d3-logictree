"use strict";

/**
 * tree object has following field
 *  - operator: AND/OR
 *  - left
 *  - right
 */
export default function Node(data) {
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
