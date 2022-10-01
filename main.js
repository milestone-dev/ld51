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
const TILE = 32;
const UNIT_SIZE_SMALL = 24;
const UNIT_SIZE_MEDIUM = 48;
const UNIT_SIZE_LARGE = 64;
const UNIT_SIZE_XLARGE = 128;
const STOPPING_RANGE = 24;
const MINING_RANGE = UNIT_SIZE_LARGE / 2;
const MINING_SEARCH_RANGE = TILE * 24;
const PLAYER_NEUTRAL = 0;
const PLAYER_HUMAN = 1;

const RESOURCE_CARRY_AMOUNT_MAX = 50;

const UnitTypeData = {};
function AddUnit(type, name, hotkey, icon, size, hp, moveSpeed, elevation) {UnitTypeData[type] = {type, name, hotkey, icon, size, hp, moveSpeed, elevation}; }
AddUnit(Type.Harvester, "Miner Guy", "h", "👾", UNIT_SIZE_MEDIUM, 100, 200, 1000);
AddUnit(Type.ResourceDepot, "Base", "b", "🛰", UNIT_SIZE_XLARGE, 100, 0, 500);
AddUnit(Type.ResourceNode, "Resource", "n", "🪨", UNIT_SIZE_LARGE, 100, 0, 0);


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
		this.targetX = Number.NaN;
		this.targetY = Number.NaN;

		// Harvester specific
		this.resourceCarryAmount = 0;
		this.previousResourceNode = null;
		this.remainingResources = 100; // TODO move to data
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
				this.resetToIdle();
			}
		} else if (this.order == Order.MoveToHarvestResourceNode) {
			if (!this.targetUnit || !this.targetUnit.isActive) {
				console.log("Trying to move to a resource node that is gone. Looking for options...");
				this.harvestNearbyResources();
			} else if (this.distanceToUnit(this.targetUnit) < MINING_RANGE) {
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
				this.harvestNearbyResources();
			}
		} else if (this.order == Order.MoveToFriendlyUnit && this.targetUnit) {
			if (this.distanceToUnit(this.targetUnit) < STOPPING_RANGE) this.resetToIdle();
		} else if (this.order == Order.MoveToAttackUnit && this.targetUnit) {
			console.log("TODO IMPLEMENT ATTACK RANGE LOGIC", this, this.targetUnit);
			this.resetToIdle();
		} else if (this.order == Order.HarvestResourceNode || this.order == Order.Idle) {
			// Pass
		} else {
			console.log("Did not manage order", this.order);
			debugger;
			this.resetToIdle();
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
	}

	Awake() {
		if (this.type == Type.Harvester) this.harvestNearbyResources();
	}

	get isActive() {
		return this.parentNode != null;
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
		this.style.transitionDuration = moveDuration + "s";
		this.style.left = px(orderX - r.width/2);
		this.style.top = px(orderY - r.height/2);
		// this.offsetHeight;
	}

	resetToIdle() {
		this.targetUnit = null;
		this.previousResourceNode = null;
		this.targetX = Number.NaN;
		this.targetY = Number.NaN;
		this.order = Order.Idle;
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


	harvestNearbyResources() {
		var resourceNode = this.previousResourceNode;
		if (!this.previousResourceNode || !this.previousResourceNode.isActive || this.previousResourceNode.remainingResources == 0) resourceNode = FindNearestUnitOfType(this, Type.ResourceNode, MINING_SEARCH_RANGE)
		if (resourceNode) this.orderToHarvestResourceUnit(resourceNode);
		else {
			console.log("Unable to find nearby resources, idling.")
			this.resetToIdle();
		}
		return resourceNode != null;
	}

	returnToNearbyDepot() {
		const nearestDepot = FindNearestUnitOfType(this, Type.ResourceDepot, Infinity);
		if (nearestDepot) this.orderToReturnResourcesToDepotUnit(nearestDepot);
		else this.resetToIdle();
		return nearestDepot != null;
	}

	update() {
		if (this.targetUnit && !this.targetUnit.isActive) this.targetUnit = null;
		if (this.previousResourceNode && !this.previousResourceNode.isActive) this.previousResourceNode = null;

		if (this.order == Order.HarvestResourceNode) {
			// TODO implement timer

			if (this.resourceCarryAmount < RESOURCE_CARRY_AMOUNT_MAX) {
				// Can carry more resources, continue harvesting
				if (this.targetUnit && this.targetUnit.isActive && this.targetUnit.type == Type.ResourceNode && this.targetUnit.remainingResources > 0) {
					this.resourceCarryAmount += 1;
					this.targetUnit.remainingResources -= 1;
				} else {
					// Look for more resources, otherwise return to home.
					console.log("Tring to mine a resource node that is now gone, find another one");
					if (!this.harvestNearbyResources() && this.resourceCarryAmount > 0) this.returnToNearbyDepot();
				}
			} else {
				// Return home
				const nearestDepot = FindNearestUnitOfType(this, Type.ResourceDepot, Infinity);
				if (nearestDepot) this.orderToReturnResourcesToDepotUnit(nearestDepot);
				else this.resetToIdle();
			}
		}

		if (this.type == Type.ResourceNode && this.remainingResources <= 0) {
			this.remove();
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

function FindNearestUnitOfType(originUnitElm, type, searchRange) {
	const nearestDepot = Array.from(GetAllUnits())
	.filter((unitElm) => { return unitElm.type == type })
	.filter((unitElm) => { return unitElm.distanceToUnit(originUnitElm) < searchRange })
	.sort((a, b) => {
		return a.distanceToUnit(originUnitElm) - b.distanceToUnit(originUnitElm);
	})

	if (nearestDepot.length == 0) return null;
	else return nearestDepot[0];
}

function CreateUnit(type, playerID,x, y) {
	const unitElm = document.createElement(UNIT_SELECTOR);
	unitElm.Setup(type, playerID);
	document.body.appendChild(unitElm);
	unitElm.Move(x,y);
	unitElm.Awake();
}

function Tick(ms) {
	document.querySelectorAll(UNIT_SELECTOR).forEach(unitElm => unitElm.update());

	statusBarElement.innerText = `Resources: ${PlayerResources}`;

	const selectedUnits = GetSelectedUnits();
	if (selectedUnits.length > 0) {
		const unitElm = selectedUnits[0];
		if (unitElm.type == Type.Harvester) Log(unitElm, unitElm.order, `${unitElm.targetX}, ${unitElm.targetY}`, unitElm.targetUnit, unitElm.previousResourceNode, unitElm.resourceCarryAmount);
		else if (unitElm.type == Type.ResourceNode) Log(unitElm, unitElm.order, `${unitElm.targetX}, ${unitElm.targetY}`, unitElm.targetUnit, unitElm.remainingResources);
		else Log(unitElm, unitElm.order, `${unitElm.targetX}, ${unitElm.targetY}`, unitElm.targetUnit);
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
		evt.preventDefault();
		const targetUnitElm = evt.target;
		GetSelectedUnits().forEach(unitElm => {
			if (!evt.target || !UnitElement.isElementUnit(evt.target)) unitElm.orderMoveToPoint(evt.pageX, evt.pageY);
			else unitElm.orderInteractWithUnit(evt.target);
		})
	});

	SetupGame();
});