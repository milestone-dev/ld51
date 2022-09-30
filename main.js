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

const UNIT_SIZE = 48;

class UnitElement extends HTMLElement {

	onTransitionStart(evt) {
		this.isMoving = true;
	}

	onTransitionEnd(evt) {
		this.isMoving = false;
	}

	constructor() {
		super();
		console.log("constructor");
		this.order = Order.Idle;
		this.type = Type.Worker;
		this.isMoving = false;
		this.moveSpeed = 200;
		this.hp = 100;

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
}

function SetupGame() {
	customElements.define("x-unit", UnitElement);
}

function CreateUnit(type) {
	const unitElm = document.createElement("x-unit");
	document.body.appendChild(unitElm);
}

document.addEventListener("DOMContentLoaded", evt => {
	console.log("Hello world");
	SetupGame();

	document.addEventListener("click", evt => {
		console.log(evt.pageX, evt.pageY);
		CreateUnit();
	});

	document.addEventListener("contextmenu", evt => {
		evt.preventDefault();
		console.log(evt.pageX, evt.pageY);
	});
});