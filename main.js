const Type = {
	Undefined: 0,
	Harvester: 1,
	ResourceDepot: 100,
	ResourceNode: 500,
}

const Order = {
	Undefined: 0,
	Idle: 1,
	MoveToPoint: 2,
	AttackToPoint: 3,
	MoveToHarvest: 4,
	Harvest: 5,
	ReturnToResourceDepot: 6,
}


const UNIT_SELECTOR = "x-unit";
const UNIT_SIZE_SMALL = 24;
const UNIT_SIZE_MEDIUM = 48;
const UNIT_SIZE_LARGE = 64;
const UNIT_SIZE_XLARGE = 128;
const PLAYER_NEUTRAL = 0;
const PLAYER_HUMAN = 1;

const UnitTypeData = [];
function AddUnit(type, name, icon, size, hp, moveSpeed, elevation) {UnitTypeData[type] = {type, name, icon, size, hp, moveSpeed, elevation}; }
AddUnit(Type.Harvester, "Harvester", "👾", UNIT_SIZE_MEDIUM, 100, 200,1000);
AddUnit(Type.ResourceDepot, "Base", "🛰", UNIT_SIZE_XLARGE, 100, 0, 500);
AddUnit(Type.ResourceNode, "Crystal", "🪨", UNIT_SIZE_LARGE, 100, 0, 0);


var mouseX, mouseY;

function px(i) {return i+"px"};

class UnitElement extends HTMLElement {

	constructor() {
		super();
		this.playerID = PLAYER_NEUTRAL;
		this.order = Order.Undefined;
		this.type = Type.Undefined;
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
		this.style.left = 0;
		this.style.top = 0;
		

		this.addEventListener("transitionstart", this.onTransitionStart);
		this.addEventListener("transitionend", this.onTransitionEnd);
	}

	Setup(type, playerID) {
		this.type = type;
		this.playerID = playerID;
		const data = UnitTypeData[this.type];

		this.style.width = data.size;
		this.style.height = data.size;
		this.style.lineHeight = px(data.size);
		this.style.fontSize = px(data.size);
		this.style.zIndex = px(data.elevation);
		this.innerText = data.icon;
		this.hp = data.hp;
		this.moveSpeed = data.moveSpeed;
		// TODO add swich here to manage unit types
		this.order = Order.Idle;
		this.dataset.type = this.type;
	}

	Move(x, y) {
		this.style.left = px(x);
		this.style.top = px(y);
		console.log("move",x,y);
	}

	get centerX() {
		const r = this.getBoundingClientRect();
		return r.x + r.width/2;
	}

	get centerY() {
		const r = this.getBoundingClientRect();
		return r.y + r.width/2;
	}

	distanceToPoint(x, y) { return Math.sqrt(Math.pow((this.centerX - x), 2) + Math.pow((this.centerY - y), 2)); }

	select() {this.classList.add("selected"); }

	deselect() {this.classList.remove("selected"); }

	orderToPoint(orderX, orderY) {
		const r = this.getBoundingClientRect();
		const distance = this.distanceToPoint(orderX,orderY);
		const moveDuration = distance / this.moveSpeed;
		console.log(distance);
		this.style.transitionDuration = moveDuration + "s";
		this.style.left = px(orderX - r.width/2);
		this.style.top = px(orderY - r.height/2);
		// this.offsetHeight;
		console.log(orderX, orderY, moveDuration);

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

function CreateUnit(type, playerID,x, y) {
	const unitElm = document.createElement(UNIT_SELECTOR);
	unitElm.Setup(type, playerID);
	document.body.appendChild(unitElm);
	unitElm.Move(x,y);
}

function Tick(ms) {
	window.requestAnimationFrame(Tick);
}

document.addEventListener("DOMContentLoaded", evt => {

	document.addEventListener("click", evt => {
		if (!evt.target || evt.target.tagName.toLowerCase() != UNIT_SELECTOR) return;
		if (!evt.shiftKey) DeselectAllUnits();
		evt.target.select();
	});

	document.addEventListener("mousemove", evt => {
		mouseX = evt.pageX;
		mouseY = evt.pageY;
	})

	document.addEventListener("keyup", evt => {
		if (evt.key == "u") CreateUnit(Type.Harvester, PLAYER_HUMAN, mouseX, mouseY);
		else if (evt.key == "b") CreateUnit(Type.ResourceDepot, PLAYER_HUMAN, mouseX, mouseY);
		else if (evt.key == "r") CreateUnit(Type.ResourceNode, PLAYER_NEUTRAL, mouseX, mouseY);
	});

	document.addEventListener("contextmenu", evt => {
		evt.preventDefault();
		GetSelectedUnits().forEach(unitElm => {
			unitElm.orderToPoint(evt.pageX, evt.pageY);
		})
	});

	SetupGame();
});