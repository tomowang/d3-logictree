export default function Point(x, y) {
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
