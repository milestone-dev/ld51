const Type = {
	Worker: 0,
	ResourceDepot: 100,
	ResourceNode: 500,
}

const Order = {
	Idle: 0,
	MoveToPoint: 1,
	AttackToPoint: 2,
	MoveToHarvest: 3,
	Harvest: 4,
	ReturnToResourceDepot: 5,
}

const UNIT_SELECTOR = "x-unit";
const UNIT_SIZE = 48;

class UnitElement extends HTMLElement {

	constructor() {
		super();
		console.log("constructor");
		this.order = Order.Idle;
		this.type = Type.Worker;
		this.isMoving = false;
		this.moveSpeed = 200;
		this.hp = 100;
	}

	onTransitionStart(evt) {
		this.isMoving = true;
	}

	onTransitionEnd(evt) {
		this.isMoving = false;
	}

	connectedCallback() {
		this.style.width = UNIT_SIZE;
		this.style.height = UNIT_SIZE;
		this.style.left = 0;
		this.style.top = 0;
		this.style.lineHeight = UNIT_SIZE+"px";
		this.style.fontSize = UNIT_SIZE+"px";

		this.innerText = "👾";

		this.addEventListener("transitionstart", this.onTransitionStart);
		this.addEventListener("transitionend", this.onTransitionEnd);
	}

	get centerX() {
		const r = this.getBoundingClientRect();
		return r.x + r.width/2;
	}

	get centerY() {
		const r = this.getBoundingClientRect();
		return r.x + r.width/2;
	}

	distanceToPoint(x, y) { return Math.sqrt(Math.pow((this.centerX - x), 2) + Math.pow((this.centerY - y), 2)); }

	select() {this.classList.add("selected"); }

	deselect() {this.classList.remove("selected"); }

	orderToPoint(x, y) {
		console.log(this.distanceToPoint(x,y));
	}
}

function SetupGame() {
	customElements.define(UNIT_SELECTOR, UnitElement);
	window.requestAnimationFrame(Tick);
}

function GetSelectedUnits() {
	return document.querySelectorAll(UNIT_SELECTOR+".selected");
}

function DeselectAllUnits() {
	document.querySelectorAll(UNIT_SELECTOR).forEach(unitElm => unitElm.classList.remove("selected"));
}

function CreateUnit(type) {
	const unitElm = document.createElement(UNIT_SELECTOR);
	document.body.appendChild(unitElm);
}

function Tick(ms) {
	window.requestAnimationFrame(Tick);
}

document.addEventListener("DOMContentLoaded", evt => {

	document.addEventListener("click", evt => {
		console.log(evt.target, evt.target.tagName.toLowerCase() == UNIT_SELECTOR, evt.shiftKey);
		if (!evt.target || evt.target.tagName.toLowerCase() != UNIT_SELECTOR) return;
		if (!evt.shiftKey) DeselectAllUnits();
		evt.target.select();
	});

	document.addEventListener("keyup", evt => {
		if (evt.key == "u") CreateUnit();
	});

	document.addEventListener("contextmenu", evt => {
		evt.preventDefault();
		GetSelectedUnits().forEach(unitElm => {
			unitElm.orderToPoint(evt.pageX, evt.pageY);
		})
	});

	SetupGame();
});