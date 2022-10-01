const Type = {
	Undefined: "Undefined",
	Harvester: "Harvester",
	Fighter: "Fighter",
	ResourceDepot: "ResourceDepot",
	ResourceNode: "ResourceNode",
}

const Order = {
	Undefined: "Undefined",
	Idle: "Idle",
	MoveToPoint: "MoveToPoint",
	MoveToFriendlyUnit: "MoveToFriendlyUnit",
	MoveToHarvestResourceNode: "MoveToHarvestResourceNode",
	HarvestResourceNode: "HarvestResourceNode",
	MoveToResourceDepot: "MoveToResourceDepot",
	ReturnResourcesInResourceDepot: "ReturnResourcesInResourceDepot",
	Guard: "Guard",
	MoveToAttackUnit: "MoveToAttackUnit",
	AttackToPoint: "AttackToPoint",
	AttackUnit: "AttackUnit",
	PatrolArea: "PatrolArea",
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
const FIGHER_SEARCH_RANGE = TILE * 10;
const PLAYER_NEUTRAL = 0;
const PLAYER_HUMAN = 1;
const PLAYER_ENEMY = 2;

const RESOURCE_CARRY_AMOUNT_MAX = 50;

const UnitTypeData = {};
function AddUnitTypeData(type, name, hotkey, icon, size, cost, buildTime, hp, moveSpeed, attackRange, attackDamage, cooldownMax, elevation) {UnitTypeData[type] = {type, name, hotkey, icon, size, cost, buildTime, hp, moveSpeed, attackRange, attackDamage, cooldownMax, elevation}; }
function GetUnitTypeData(unitType) { return UnitTypeData[unitType]; }
AddUnitTypeData(Type.Harvester, "Miner Droid", "h", "👾", UNIT_SIZE_MEDIUM, 50, 30, 100, 200, MINING_RANGE, 0, 10, 1000);
AddUnitTypeData(Type.Fighter, "Interceptor", "f", "🚀", UNIT_SIZE_MEDIUM, 50, 30, 100, 250, TILE * 6, 5, 10, 1000);
AddUnitTypeData(Type.ResourceDepot, "Mining Base", "b", "🛰", UNIT_SIZE_XLARGE, 400, 60, 100, 0, 0, 0, 0, 500);
AddUnitTypeData(Type.ResourceNode, "Aseroid", "n", "🪨", UNIT_SIZE_LARGE, 0, 0, 100, 0, 0, 0, 0, 0);

var UNIT_ID = 0;
var mouseX, mouseY, debugOutputElement, statusBarElement;
var PlayerResources = [0, 0, 0, 0];
const log = console.log;

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
		this.remainingResources = 6000; // TODO move to data
	}

	Setup(type, playerID) {
		this.id = `unit-${UNIT_ID++}`;
		this.type = type;
		if (type == Type.ResourceNode) playerID = PLAYER_NEUTRAL;
		this.playerID = playerID;
		const data = GetUnitTypeData(this.type);
		Object.keys(data).forEach(key => this[key] = data[key]);
		this.style.width = data.size;
		this.style.height = data.size;
		this.style.lineHeight = px(data.size);
		this.style.fontSize = px(data.size);
		this.style.zIndex = data.elevation;
		this.innerText = data.icon;
		this.moveSpeed = data.moveSpeed;
		this.order = Order.Idle;
		this.dataset.type = this.type;
		this.dataset.player = this.playerID;
		this.cooldown = 0;
		log(this);
	}

	toString() {
		return `P${this.playerID} ${this.name} (${this.type})`;
	}

	onTransitionStart(evt) {
		this.isMoving = true;
	}

	onTransitionEnd(evt) {
		console.log("onTransitionEnd", this.order);
		this.isMoving = false;

		if (this.order == Order.MoveToPoint) {
			if (this.distanceToPoint(this.targetX, this.targetY) < STOPPING_RANGE) {
				// log("Reached point, idling!");
				this.resetToIdle();
			}
		} else if (this.order == Order.MoveToHarvestResourceNode) {
			if (!this.targetUnit || !this.targetUnit.isActive) {
				log("Trying to move to a resource node that is gone. Looking for options...");
				this.harvestNearbyResources();
			} else if (this.distanceToUnit(this.targetUnit) < MINING_RANGE) {
				log("Reached node, start harvesting!");
				this.order = Order.HarvestResourceNode;
				this.previousResourceNode = this.targetUnit;
			}
		} else if (this.order == Order.HarvestResourceNode && this.targetUnit) {
			// Pass
		} else if (this.order == Order.MoveToResourceDepot && this.targetUnit) {
			if (this.distanceToUnit(this.targetUnit) < MINING_RANGE) {
				// log("Reached depot, depositing resources and finding another resoruce!");
				PlayerResources[this.playerID] += this.resourceCarryAmount;
				this.resourceCarryAmount = 0;
				this.harvestNearbyResources();
			}
		} else if (this.order == Order.MoveToFriendlyUnit && this.targetUnit) {
			if (this.distanceToUnit(this.targetUnit) < STOPPING_RANGE) this.resetToIdle();
		} else if (this.order == Order.MoveToAttackUnit && this.targetUnit) {
			if (this.distanceToUnit(this.targetUnit) < this.attackRange) {
				// log("TODO IMPLEMENT ATTACK RANGE LOGIC", this, this.targetUnit);
				// this.stop();
				this.order = Order.AttackUnit;
			}
		} else if (this.order == Order.HarvestResourceNode || this.order == Order.AttackUnit || this.order == Order.Idle) {
			// Pass
		} else {
			log("Did not manage order", this.order);
			this.resetToIdle();
		}

	}

	connectedCallback() {
		this.style.left = 0;
		this.style.top = 0;
		

		this.addEventListener("transitionstart", this.onTransitionStart);
		this.addEventListener("transitionend", this.onTransitionEnd);
	}

	Move(x, y) {
		this.style.left = px(x);
		this.style.top = px(y);
	}

	Awake() {
		if (this.isHarvester) this.harvestNearbyResources();
	}


	get centerX() {
		const r = this.getBoundingClientRect();
		return r.x + r.width/2;
	}

	get centerY() {
		const r = this.getBoundingClientRect();
		return r.y + r.width/2;
	}

	get isActive() {return this.parentNode != null; }
	get isMobile() {return this.moveSpeed > 0; }
	get isNeutral() {return this.playerID == PLAYER_NEUTRAL; }
	get isHarvester() {return this.type == Type.Harvester; }
	get isFighter() {return this.type == Type.Fighter; }
	get isResourceNode() {return this.type == Type.ResourceNode; }
	get isResoruceDepot() {return this.type == Type.ResourceDepot; }

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
		if (this.isHarvester && targetUnit.isResourceNode) {
			this.orderToHarvestResourceUnit(targetUnit);
		} else if (targetUnit.playerID == this.playerID || targetUnit.playerID == PLAYER_NEUTRAL) {
			this.orderMoveToFriendlyUnit(targetUnit);
		} else if (targetUnit.playerID != this.playerID && targetUnit.playerID != PLAYER_NEUTRAL) {
			this.orderMoveToAttackUnit(targetUnit);
		} else {
			// TODO handle Attack, Follow etc
			log("unhandled orderInteractWithUnit");
		}
	}

	stop() {
		const r = this.getBoundingClientRect();
		const distance = 0;
		const moveDuration = distance / this.moveSpeed;
		this.style.transitionDuration = moveDuration + "s";
		this.style.left = px(r.x - r.width/2);
		this.style.top = px(r.y - r.height/2);
	}

	destroy() {
		this.hp = 0;
		this.remove();
	}

	facePoint(x,y) {
		const atan = Math.atan2(y - this.centerY, x - this.centerX) + Math.PI/2
		this.style.transform = `rotate(${atan}rad)`;
	}

	harvestNearbyResources() {
		var resourceNode = this.previousResourceNode;
		if (!this.previousResourceNode || !this.previousResourceNode.isActive || this.previousResourceNode.remainingResources == 0) resourceNode = FindNearestUnitOfType(this, Type.ResourceNode, MINING_SEARCH_RANGE)
		if (resourceNode) this.orderToHarvestResourceUnit(resourceNode);
		else {
			log("Unable to find nearby resources, idling.")
			this.resetToIdle();
		}
		return resourceNode != null;
	}

	returnToNearbyDepot() {
		const nearestDepot = FindNearestUnitOfType(this, Type.ResourceDepot, Infinity, true);
		if (nearestDepot) this.orderToReturnResourcesToDepotUnit(nearestDepot);
		else this.resetToIdle();
		return nearestDepot != null;
	}

	trainUnit(unitType) {
		//For now all units can train all units
		const data = GetUnitTypeData(unitType);
		if (PlayerResources[this.playerID] >= data.cost) {
			PlayerResources[this.playerID] -= data.cost
			CreateUnit(unitType, this.playerID, this.centerX, this.centerY);
		} else {
			log("Not enough resources for", unitType);
		}
	}

	update() {
		if (this.hp <= 0) this.destroy();

		if (this.isFighter && this.order == Order.Idle) this.order = Order.Guard;
		if (this.targetUnit && !this.targetUnit.isActive) this.targetUnit = null;
		if (this.previousResourceNode && !this.previousResourceNode.isActive) this.previousResourceNode = null;

		if (this.order == Order.HarvestResourceNode) {
			if (this.resourceCarryAmount < RESOURCE_CARRY_AMOUNT_MAX) {
				// Can carry more resources, continue harvesting
				if (this.targetUnit && this.targetUnit.isActive && this.targetUnit.isResourceNode && this.targetUnit.remainingResources > 0) {
					if (this.cooldown <= 0) {
						this.resourceCarryAmount += 1;
						this.targetUnit.remainingResources -= 1;
						this.cooldown = this.cooldownMax;
					} else this.cooldown--;
				} else {
					// Look for more resources, otherwise return to home.
					log("Tring to mine a resource node that is now gone, find another one");
					if (!this.harvestNearbyResources() && this.resourceCarryAmount > 0) this.returnToNearbyDepot();
				}
			} else {
				// Return home
				const nearestDepot = FindNearestUnitOfType(this, Type.ResourceDepot, Infinity, true);
				if (nearestDepot) this.orderToReturnResourcesToDepotUnit(nearestDepot);
				else this.resetToIdle();
			}
		}

		if (this.order == Order.AttackUnit) {
			if (this.targetUnit && this.targetUnit.isActive) {
				if (this.cooldown <= 0) {
					this.targetUnit.hp -= this.attackDamage;
					this.cooldown = this.cooldownMax;
				} else this.cooldown--;
			} else this.resetToIdle();
		}


		if (this.order == Order.Guard) {
			const nearestUnit = FindNearestEnemyUnit(this, FIGHER_SEARCH_RANGE);
			if (nearestUnit) this.orderMoveToAttackUnit(nearestUnit);
			else this.resetToIdle();
		}

		if (this.isResourceNode && this.remainingResources <= 0) {
			this.destroy();
		}



		

		if (this.isMobile) {
			var faceX = this.targetUnit ? this.targetUnit.centerX : this.targetX;
			var faceY = this.targetUnit ? this.targetUnit.centerY : this.targetY;
			if (faceX != Number.NaN && faceY != Number.NaN) {
				this.facePoint(faceX, faceY);
			}
		}

	}
}

function SetupGame() {
	debugOutputElement = document.getElementById("debugOutput");
	statusBarElement = document.getElementById("statusBar");
	customElements.define(UNIT_SELECTOR, UnitElement);
	window.requestAnimationFrame(Tick);
	PlayerResources[PLAYER_HUMAN] = 100;
}

function Log(...args) {
	debugOutputElement.innerHTML = args.join("<br>");
}

function GetSelectedUnits() {
	return document.querySelectorAll(UNIT_SELECTOR+".selected");
}

function GetSelectedUnit() {
	return document.querySelector(UNIT_SELECTOR+".selected");
}

function GetAllUnits() {
	return document.querySelectorAll(UNIT_SELECTOR);
}

function DeselectAllUnits() {
	document.querySelectorAll(UNIT_SELECTOR).forEach(unitElm => unitElm.classList.remove("selected"));
}

function FindNearestUnitOfType(originUnitElm, type, searchRange, samePlayerRequirement = false) {
	const nearestUnit = Array.from(GetAllUnits())
	.filter((unitElm) => { return samePlayerRequirement ? (originUnitElm.playerID == unitElm.playerID) : true })
	.filter((unitElm) => { return  unitElm.type == type })
	.filter((unitElm) => { return unitElm.distanceToUnit(originUnitElm) < searchRange })
	.sort((a, b) => {
		return a.distanceToUnit(originUnitElm) - b.distanceToUnit(originUnitElm);
	})

	if (nearestUnit.length == 0) return null;
	else return nearestUnit[0];
}

function FindNearestEnemyUnit(originUnitElm, searchRange) {
	const nearestUnit = Array.from(GetAllUnits())
	.filter((unitElm) => { return !unitElm.isNeutral && unitElm.playerID != originUnitElm.playerID })
	.filter((unitElm) => { return unitElm.distanceToUnit(originUnitElm) < searchRange })
	.sort((a, b) => {
		return a.distanceToUnit(originUnitElm) - b.distanceToUnit(originUnitElm);
	})
	// TODO sort priority eg attackers first

	if (nearestUnit.length == 0) return null;
	else return nearestUnit[0];
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

	statusBarElement.innerText = `Resources: ${PlayerResources[PLAYER_HUMAN]}`;

	const selectedUnits = GetSelectedUnits();
	if (selectedUnits.length > 0) {
		const unitElm = selectedUnits[0];
		if (unitElm.isHarvester) Log(unitElm, `${unitElm.hp} hp`, unitElm.order, `${unitElm.targetX}, ${unitElm.targetY}`, unitElm.targetUnit, unitElm.previousResourceNode, unitElm.resourceCarryAmount, `${unitElm.cooldown}/${unitElm.cooldownMax}`);
		else if (unitElm.isFighter) Log(unitElm, `${unitElm.hp} hp`, unitElm.order, `${unitElm.targetX}, ${unitElm.targetY}`, unitElm.targetUnit, `${unitElm.cooldown}/${unitElm.cooldownMax}`);
		else if (unitElm.isResourceNode) Log(unitElm, unitElm.order, `${unitElm.targetX}, ${unitElm.targetY}`, unitElm.targetUnit, unitElm.remainingResources);
		else if (!unitElm.isMobile) Log(unitElm, `${unitElm.hp} hp`, unitElm.order);
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
		Object.keys(UnitTypeData).forEach(key => {
			if (evt.key.toLowerCase() == GetUnitTypeData(key).hotkey) {
				// log(evt);
				if (evt.shiftKey) {
					CreateUnit(UnitTypeData[key].type, evt.ctrlKey ? PLAYER_ENEMY : PLAYER_HUMAN, mouseX, mouseY)
				} else {
					const selectedUnit = GetSelectedUnit();
					if (selectedUnit) selectedUnit.trainUnit(UnitTypeData[key].type);
					else log("No selected unit. Hold shift to spawn");
				}
			}
		});
	});

	document.addEventListener("contextmenu", evt => {
		evt.preventDefault();
		const targetUnitElm = evt.target;
		GetSelectedUnits().forEach(unitElm => {
			if (unitElm.isMobile) {
				if (!evt.target || !UnitElement.isElementUnit(evt.target)) unitElm.orderMoveToPoint(evt.pageX, evt.pageY);
				else unitElm.orderInteractWithUnit(evt.target);
			}
		})
	});

	SetupGame();
});