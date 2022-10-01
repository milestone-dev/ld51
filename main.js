const Type = {
	Undefined: "Undefined",
	Harvester: "Harvester",
	ResourceDepot: "ResourceDepot",
	ResourceNode: "ResourceNode",
}

const Order = {
	Undefined: "Undefined",
	Idle: "Idle",
	MoveToPoint: "MoveToPoint",
	MoveToFriendlyUnit: "MoveToFriendlyUnit",
	MoveToAttackUnit: "MoveToAttackUnit",
	AttackToPoint: "AttackToPoint",
	MoveToHarvestResourceNode: "MoveToHarvestResourceNode",
	HarvestResourceNode: "HarvestResourceNode",
	MoveToResourceDepot: "MoveToResourceDepot",
	ReturnResourcesInResourceDepot: "ReturnResourcesInResourceDepot",
}


const UNIT_SELECTOR = "x-unit";
const UNIT_SIZE_SMALL = 24;
const UNIT_SIZE_MEDIUM = 48;
const UNIT_SIZE_LARGE = 64;
const UNIT_SIZE_XLARGE = 128;
const STOPPING_RANGE = 24;
const MINING_RANGE = UNIT_SIZE_LARGE / 2;
const PLAYER_NEUTRAL = 0;
const PLAYER_HUMAN = 1;
const UNDEFINED_NUMBER = 123456789;

const RESOURCE_CARRY_AMOUNT_MAX = 50;

const UnitTypeData = {};
function AddUnit(type, name, hotkey, icon, size, hp, moveSpeed, elevation) {UnitTypeData[type] = {type, name, hotkey, icon, size, hp, moveSpeed, elevation}; }
AddUnit(Type.Harvester, "Miner Guy", "h", "👾", UNIT_SIZE_MEDIUM, 100, 200, 1000);
AddUnit(Type.ResourceDepot, "Base", "b", "🛰", UNIT_SIZE_XLARGE, 100, 0, 500);
AddUnit(Type.ResourceNode, "Resource", "r", "🪨", UNIT_SIZE_LARGE, 100, 0, 0);


var mouseX, mouseY, debugOutputElement, statusBarElement;
var PlayerResources = 100;

function px(i) {return i+"px"};

class UnitElement extends HTMLElement {

	static isElementUnit(elm) {
		return elm.tagName.toLowerCase() == UNIT_SELECTOR;
	}

	constructor() {
		super();
		this.playerID = PLAYER_NEUTRAL;
		this.type = Type.Undefined;
		this.name = null;
		this.order = Order.Undefined;
		this.isMoving = false;
		this.moveSpeed = 0;
		this.hp = 1;
		this.targetUnit = null;
		this.targetX = UNDEFINED_NUMBER;
		this.targetY = UNDEFINED_NUMBER;

		// Harvester specific
		this.resourceCarryAmount = 0;
		this.previousResourceNode = null;
		this.remainingResources = 10000; // TODO move to data
	}

	toString() {
		return `${this.name} (${this.type})`;
	}

	onTransitionStart(evt) {
		this.isMoving = true;
	}

	onTransitionEnd(evt) {
		this.isMoving = false;

		if (this.order == Order.MoveToPoint) {
			if (this.distanceToPoint(this.targetX, this.targetY) < STOPPING_RANGE) {
				// console.log("Reached point, idling!");
				this.order = Order.Idle;
			}
		} else if (this.order == Order.MoveToHarvestResourceNode && this.targetUnit) {
			if (this.distanceToUnit(this.targetUnit) < MINING_RANGE) {
				console.log("Reached node, start harvesting!");
				this.order = Order.HarvestResourceNode;
				this.previousResourceNode = this.targetUnit;
			}
		} else if (this.order == Order.HarvestResourceNode && this.targetUnit) {
			// Pass
		} else if (this.order == Order.MoveToResourceDepot && this.targetUnit) {
			if (this.distanceToUnit(this.targetUnit) < MINING_RANGE) {
				// console.log("Reached depot, depositing resources and finding another resoruce!");
				PlayerResources += this.resourceCarryAmount;
				this.resourceCarryAmount = 0;

				if (this.previousResourceNode) {
					this.orderToHarvestResourceUnit(this.previousResourceNode);
				} else {
					// TODO find a resource node
					this.order = Order.Idle;
				}
			}
		} else if (this.order == Order.MoveToFriendlyUnit && this.targetUnit) {
			if (this.distanceToUnit(this.targetUnit) < STOPPING_RANGE) this.order = Order.Idle;
		} else if (this.order == Order.MoveToAttackUnit && this.targetUnit) {
			console.log("TODO IMPLEMENT ATTACK RANGE LOGIC", this, this.targetUnit);
			this.order = Order.Idle;
		} else if (this.order == Order.HarvestResourceNode || this.order == Order.Idle) {
			// Pass
		} else {
			console.log("Did not manage order", this.order);
			debugger;
			this.order = Order.Idle;
		}

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
		this.name = data.name;
		this.style.width = data.size;
		this.style.height = data.size;
		this.style.lineHeight = px(data.size);
		this.style.fontSize = px(data.size);
		this.style.zIndex = data.elevation;
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
	distanceToUnit(unitElm) { return this.distanceToPoint(unitElm.centerX, unitElm.centerY); }

	select() {this.classList.add("selected"); }

	deselect() {this.classList.remove("selected"); }

	travelToPoint(orderX, orderY) {
		if (this.moveSpeed == 0) return;
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

	orderMoveToPoint(targetX, targetY) {
		this.targetUnit = null;
		this.order = Order.MoveToPoint;
		this.targetX = targetX;
		this.targetY = targetY;
		this.travelToPoint(targetX, targetY);
	}

	// TODO dedup
	orderToHarvestResourceUnit(targetUnit) {
		this.targetUnit = targetUnit;
		this.order = Order.MoveToHarvestResourceNode;
		this.travelToPoint(targetUnit.centerX, targetUnit.centerY);
	}

	orderToReturnResourcesToDepotUnit(targetUnit) {
		this.targetUnit = targetUnit;
		this.order = Order.MoveToResourceDepot;
		this.travelToPoint(targetUnit.centerX, targetUnit.centerY);
	}

	orderMoveToFriendlyUnit(targetUnit) {
		this.targetUnit = targetUnit;
		this.order = Order.MoveToFriendlyUnit;
		this.travelToPoint(targetUnit.centerX, targetUnit.centerY);
	}

	orderMoveToAttackUnit(targetUnit) {
		this.targetUnit = targetUnit;
		this.order = Order.MoveToAttackUnit;
		this.travelToPoint(targetUnit.centerX, targetUnit.centerY);
	}

	orderInteractWithUnit(targetUnit) {
		if (this.type == Type.Harvester && targetUnit.type == Type.ResourceNode) {
			this.orderToHarvestResourceUnit(targetUnit);
		} else if (targetUnit.playerID == this.playerID || targetUnit.playerID == PLAYER_NEUTRAL) {
			this.orderMoveToFriendlyUnit(targetUnit);
		} else if (targetUnit.playerID != this.playerID && targetUnit.playerID != PLAYER_NEUTRAL) {
			this.orderMoveToAttackUnit(targetUnit);
		} else {
			// TODO handle Attack, Follow etc
			console.log("unhandled orderInteractWithUnit");
		}
	}

	update() {
		if (this.order == Order.HarvestResourceNode && this.targetUnit && this.targetUnit.type == Type.ResourceNode) {
			// TODO implement timer
			if (this.resourceCarryAmount >= RESOURCE_CARRY_AMOUNT_MAX) {
				const nearestDepot = FindNearestResourceDepot(this);
				if (nearestDepot) this.orderToReturnResourcesToDepotUnit(nearestDepot);
				else this.order = Order.Idle;
			} else {
				this.resourceCarryAmount += 1;
				this.targetUnit.remainingResources -= 1;
			}
		}
	}
}

function SetupGame() {
	debugOutputElement = document.getElementById("debugOutput");
	statusBarElement = document.getElementById("statusBar");
	customElements.define(UNIT_SELECTOR, UnitElement);
	window.requestAnimationFrame(Tick);
}

function Log(...args) {
	debugOutputElement.innerHTML = args.join("<br>");
}

function GetSelectedUnits() {
	return document.querySelectorAll(UNIT_SELECTOR+".selected");
}

function GetAllUnits() {
	return document.querySelectorAll(UNIT_SELECTOR);
}

function DeselectAllUnits() {
	document.querySelectorAll(UNIT_SELECTOR).forEach(unitElm => unitElm.classList.remove("selected"));
}

function FindNearestResourceDepot(unitElm) {
	const nearestDepot = Array.from(GetAllUnits())
	.filter((unitElm) => { return unitElm.type == Type.ResourceDepot})
	.sort((a, b) => {
		return a.distanceToUnit(unitElm) - b.distanceToUnit(unitElm);
	})

	if (nearestDepot.length == 0) return null;
	else return nearestDepot[0];
}

function CreateUnit(type, playerID,x, y) {
	const unitElm = document.createElement(UNIT_SELECTOR);
	unitElm.Setup(type, playerID);
	document.body.appendChild(unitElm);
	unitElm.Move(x,y);
}

function Tick(ms) {
	document.querySelectorAll(UNIT_SELECTOR).forEach(unitElm => unitElm.update());


	statusBarElement.innerText = `Resources: ${PlayerResources}`;


	const selectedUnits = GetSelectedUnits();
	if (selectedUnits.length > 0) {
		const unitElm = selectedUnits[0];
		Log(unitElm, unitElm.order, `${unitElm.targetX}, ${unitElm.targetY}`, unitElm.targetUnit, unitElm.resourceCarryAmount);
	}

	window.requestAnimationFrame(Tick);
}

document.addEventListener("DOMContentLoaded", evt => {

	document.addEventListener("click", evt => {
		if (!evt.target || !UnitElement.isElementUnit(evt.target)) return;
		if (!evt.shiftKey) DeselectAllUnits();
		evt.target.select();
	});

	document.addEventListener("mousemove", evt => {
		mouseX = evt.pageX;
		mouseY = evt.pageY;
	})

	document.addEventListener("keyup", evt => {
		Object.keys(UnitTypeData).forEach(key => { if (evt.key == UnitTypeData[key].hotkey) CreateUnit(UnitTypeData[key].type, PLAYER_HUMAN, mouseX, mouseY); });
	});

	document.addEventListener("contextmenu", evt => {
		console.log(evt);
		evt.preventDefault();
		const targetUnitElm = evt.target;
		GetSelectedUnits().forEach(unitElm => {
			if (!evt.target || !UnitElement.isElementUnit(evt.target)) unitElm.orderMoveToPoint(evt.pageX, evt.pageY);
			else unitElm.orderInteractWithUnit(evt.target);
		})
	});

	SetupGame();
});