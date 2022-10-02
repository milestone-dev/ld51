

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
	AttackMoveToPoint: "AttackMoveToPoint",
	AttackUnit: "AttackUnit",
	PatrolArea: "PatrolArea",
}


const UNIT_SELECTOR = "x-unit";
const SPRITE_SELECTOR = "x-sprite";
const OVERLAY_SELECTOR = "x-overlay";
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
const PATROL_RANGE = TILE*8;
const MINIMAP_SCALE = 64;
const WORLD_SIZE = 128*64;
const EXPLOSION_SPRITE_TIMEOUT = 300;
const GAME_EVENT_INTERVAL = 10000;

const RESOURCE_CARRY_AMOUNT_MAX = 50;

const Type = {
	Undefined: "Undefined",
	ResourceNode: "ResourceNode",
	ResourceDepot: "ResourceDepot",
	StaticDefense: "StaticDefense",
	PowerExtender: "PowerExtender",
	Harvester: "Harvester",
	Fighter: "Fighter",
}
const UnitTypeData = {};
//{type, name, hotkey, icon, size, cost, elevation, buildTime, hp, priority, powerRange, moveSpeed, attackRange, attackDamage, cooldownMax, unitsTrained = []}
function AddUnitTypeData(type, name, hotkey, icon, tooltip, size, data = {}) {
	UnitTypeData[type] = {type, name, hotkey, icon, tooltip, size};
	Object.keys(data).forEach(key => UnitTypeData[type][key] = data[key]);
}
function GetUnitTypeData(unitType) { return UnitTypeData[unitType]; }
AddUnitTypeData(Type.Harvester, "Miner pod", "h", "👾", "Cost: 50. Primary harvest unit.", UNIT_SIZE_MEDIUM, {cost:50, elevation:1000, buildTime:30, hp:100, priority:100, moveSpeed:200, attackRange:MINING_RANGE, cooldownMax:10});
AddUnitTypeData(Type.Fighter, "Interceptor", "f", "🚀", "Cost: 50. Primary fighter unit.", UNIT_SIZE_MEDIUM, {cost:50, elevation:1000, buildTime:30, hp:100, priority:50, moveSpeed:200, attackDamage:10, attackRange:TILE*6, cooldownMax:10});
AddUnitTypeData(Type.ResourceDepot, "Mining Base", "b", "🛰", "Cost: 400. Primary resource depot and harvester training facility.", UNIT_SIZE_XLARGE, {isBuilding:true, cost:400, elevation:500, buildTime:30, hp:1000, priority:300, powerRange:TILE*10, unitsTrained:[Type.Harvester, Type.Fighter]});
AddUnitTypeData(Type.PowerExtender, "Power Extender", "p", "📍", "Cost: 100. Extends power range to allow base expansion.", UNIT_SIZE_MEDIUM, {isBuilding: true, cost:100, elevation:500, buildTime:30, hp:200, priority:100, powerRange:TILE*8});
AddUnitTypeData(Type.StaticDefense, "Tesla Coil Defense", "d", "🗼", "Cost: 200. Primary static defense structure.", UNIT_SIZE_MEDIUM, {isBuilding:true, cost:200, elevation:500, buildTime:30, hp:1000, priority:70, attackDamage:40, attackRange:TILE*10, cooldownMax:10});
AddUnitTypeData(Type.ResourceNode, "Asteroid", "n", "🪨", "", UNIT_SIZE_LARGE);
AddUnitTypeData(Type.Powerup, "Precursor Artefact", "a", "🗿", "", UNIT_SIZE_SMALL);

const GameEvent = {
	NewResource: "NewResource",
	ShipwreckCall: "ShipwreckCall",
	MapScan: "MapScan",
	PirateInvasion: "PirateInvasion",
	AlienInvasion: "AlienInvasion",
	WarpRift: "WarpRift",
	IonStorm: "IonStorm",
	Artefact: "Artefact",
	Reinforcements: "Reinforcements",
	MoraleBoost: "MoraleBoost",
	MoraleLoss: "MoraleLoss",
	NetworkError: "NetworkError",
} 
const GameEventData = {}
var GameEvents = [];
function AddGameEventData(id, message, weight) {GameEventData[id] = {id, message, weight}; }
function GetGameEvent(id) { return GameEventData[id]; }
AddGameEventData(GameEvent.NewResource, "A new resource has been discovered", 10);
AddGameEventData(GameEvent.ShipwreckCall, "Shipwrecked star travellers ask for help", 10);
AddGameEventData(GameEvent.MapScan, "Sector scanned", 10);
AddGameEventData(GameEvent.PirateInvasion, "Pirates vessels sighted in the sector", 10);
AddGameEventData(GameEvent.AlienInvasion, "Alien presence discovered", 10);
AddGameEventData(GameEvent.WarpRift, "Brace for warp rift", 10);
AddGameEventData(GameEvent.IonStorm, "Brace for incoming Ion storm", 10);
AddGameEventData(GameEvent.Artefact, "Precursor Artefact has been discoreved", 10);
AddGameEventData(GameEvent.Reinforcements, "Reinforcements have arrived", 10);
AddGameEventData(GameEvent.MoraleBoost, "Morale is surging. Worker speed increased by 10%.", 10);
AddGameEventData(GameEvent.MoraleLoss, "Worker morale has taken a hit. Worker speed decreased by 20%", 10);
AddGameEventData(GameEvent.NetworkError, "A long range frequency network outage has been discovered.", 10);

var UNIT_ID = 0;
var mouseX, mouseY, mouseDown, mousePlaceX, mousePlaceY, mouseClientX, mouseClientY;
var worldElement, uiElement, unitInfoElement, trainButtonsElement, buildBarElement, statusBarElement, minimapElement, eventInfoElement, buildingPlacementGhostElement;
var PlayerResources = [0, 0, 0, 0];
var eventInterval;
var HumanPlayerTownHall = null;
var CurrentBuildingPlaceType = null;
var CurrentDisplayUnit = null;
var CurrentBuildingPlacemenValid = false;
var TooltipDisplaying = false;

const log = console.log;

function px(i) {return i+"px"};

class SpriteElement extends HTMLElement {}
class OverlayElement extends HTMLElement {}

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
		this.patrolOriginX = Number.NaN;
		this.patrolOriginY = Number.NaN;

		// Harvester specific
		this.resourceCarryAmount = 0;
		this.previousResourceNode = null;
		this.remainingResources = 6000; // TODO move to data
	}

	Setup(type, playerID) {
		this.id = `unit-${UNIT_ID++}`;
		this.type = type;
		if (type == Type.ResourceNode || type == Type.Powerup) playerID = PLAYER_NEUTRAL;
		this.playerID = playerID;
		const data = GetUnitTypeData(this.type);
		Object.keys(data).forEach(key => this[key] = data[key]);
		this.style.width = px(data.size);
		this.style.height = px(data.size);
		this.style.lineHeight = px(data.size);
		this.style.fontSize = px(data.size);
		this.style.zIndex = data.elevation;
		this.innerText = data.icon;
		this.moveSpeed = data.moveSpeed;
		this.order = Order.Idle;
		this.dataset.type = this.type;
		this.dataset.player = this.playerID;
		this.cooldown = 0;

		if (this.powerRange && this.powerRange > 0) {
			const overlayElm = document.createElement(OVERLAY_SELECTOR);
			overlayElm.style.width = px(this.powerRange*2);
			overlayElm.style.height = px(this.powerRange*2);
			overlayElm.style.top = px(-(this.powerRange-this.size/2));
			overlayElm.style.left = px(-(this.powerRange-this.size/2));
			this.appendChild(overlayElm);
		}
	}

	toString() {
		return `P${this.playerID} ${this.name} (${this.type})`;
	}

	onTransitionStart(evt) {
		this.isMoving = true;
	}

	onTransitionEnd(evt) {
		// console.log("onTransitionEnd", this.order);
		this.isMoving = false;

		if (this.order == Order.MoveToPoint) {
			if (this.distanceToPoint(this.targetX, this.targetY) < STOPPING_RANGE) {
				// log("Reached point, idling!");
				this.resetToIdle();
			}
		} else if (this.order == Order.MoveToHarvestResourceNode) {
			if (!this.targetUnit || !this.targetUnit.isActive) {
				// log("Trying to move to a resource node that is gone. Looking for options...");
				this.harvestNearbyResources();
			} else if (this.distanceToUnit(this.targetUnit) < MINING_RANGE) {
				// log("Reached node, start harvesting!");
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
			if (this.distanceToUnit(this.targetUnit) < STOPPING_RANGE) {
				if (this.isHarvester && this.targetUnit.isPowerup) {
					this.pickupUnit(this.targetUnit);
				}
				this.resetToIdle();
			}
		} else if (this.order == Order.MoveToAttackUnit && this.targetUnit) {
			if (this.distanceToUnit(this.targetUnit) < this.attackRange) {
				// this.stop();
				this.order = Order.AttackUnit;
			}
		} else if (this.order == Order.HarvestResourceNode || this.order == Order.AttackUnit || this.order == Order.Idle || this.order == Order.PatrolArea) {
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
		return r.x + window.scrollX + r.width/2;
	}

	get centerY() {
		const r = this.getBoundingClientRect();
		return r.y + window.scrollY + r.width/2;
	}

	get isActive() {return this.parentNode != null; }
	get isMobile() {return this.moveSpeed > 0; }
	get isNeutral() {return this.playerID == PLAYER_NEUTRAL; }
	get isHarvester() {return this.type == Type.Harvester; }
	get isPowerup() {return this.type == Type.Powerup; }
	get isFighter() {return this.type == Type.Fighter; }
	get isStaticDefense() {return this.type == Type.StaticDefense; }
	get isResourceNode() {return this.type == Type.ResourceNode; }
	get isResoruceDepot() {return this.type == Type.ResourceDepot; }
	get providesPower() {return this.powerRange > 0; }
	get requiresPower() {return this.isBuilding; }

	providesPowerAtPoint(x, y) {
		if (!this.providesPower) return false;
		const xMin = this.centerX - this.powerRange;
		const xMax = this.centerX + this.powerRange;
		const yMin = this.centerY - this.powerRange;
		const yMax = this.centerY + this.powerRange;
		return (x >= xMin && x <= xMax && y >= yMin && y <= yMax);
	}

	distanceToPoint(x, y) { return Math.sqrt(Math.pow((this.centerX - x), 2) + Math.pow((this.centerY - y), 2)); }
	distanceToUnit(unitElm) { return this.distanceToPoint(unitElm.centerX, unitElm.centerY); }

	select() {this.classList.add("selected"); }

	deselect() {this.classList.remove("selected"); }

	travelToPoint(orderX, orderY) {
		// console.log(orderX, orderY);
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
		this.patrolOriginX = Number.NaN;
		this.patrolOriginY = Number.NaN;
	}

	orderMoveToPoint(targetX, targetY) {
		this.targetUnit = null;
		this.order = Order.MoveToPoint;
		this.targetX = targetX;
		this.targetY = targetY;
		this.travelToPoint(targetX, targetY);
	}

	orderAttackMoveToPoint(targetX, targetY) {
		this.targetUnit = null;
		this.order = Order.AttackMoveToPoint;
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

	orderToPatrolInArea() {
		if (Number.isNaN(this.patrolOriginX)) this.patrolOriginX = this.centerX;
		if (Number.isNaN(this.patrolOriginY)) this.patrolOriginY = this.centerY;
		this.order = Order.PatrolArea;
		const x = this.patrolOriginX - PATROL_RANGE + Math.random()*PATROL_RANGE;
		const y = this.patrolOriginY - PATROL_RANGE + Math.random()*PATROL_RANGE;
		this.targetX = x;
		this.targetY = y;
		this.travelToPoint(x, y);
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
		this.style.left = px(r.x - r.width/2); // window.scrollX
		this.style.top = px(r.y - r.height/2); // window.scrollY
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
			DisplayErrorMessage("Not enough resources");
		}
	}

	createSpriteEffect(emoji) {
		const elm = document.createElement(SPRITE_SELECTOR);
		elm.innerText = emoji;
		elm.classList.add("explosion");
		this.appendChild(elm);
		window.setTimeout(e => elm.remove(), EXPLOSION_SPRITE_TIMEOUT);
	}

	pickupUnit(unitElm) {
		if (!unitElm.isPowerup) return;
		// TODO add bonus for retrieval
		unitElm.remove();
	}

	update() {
		if (this.hp <= 0) this.destroy();

		if ((this.isFighter || this.isStaticDefense) && this.order == Order.Idle) this.order = Order.Guard;
		if (this.targetUnit && !this.targetUnit.isActive) this.targetUnit = null;
		if (this.previousResourceNode && !this.previousResourceNode.isActive) this.previousResourceNode = null;

		if (this.order == Order.HarvestResourceNode) {
			if (this.resourceCarryAmount < RESOURCE_CARRY_AMOUNT_MAX) {
				// Can carry more resources, continue harvesting
				if (this.targetUnit && this.targetUnit.isActive && this.targetUnit.isResourceNode && this.targetUnit.remainingResources > 0) {
					if (this.cooldown <= 0) {
						this.targetUnit.createSpriteEffect("✨");
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
					this.targetUnit.createSpriteEffect("💥");
					this.targetUnit.hp -= this.attackDamage;
					this.cooldown = this.cooldownMax;
				} else this.cooldown--;
			} else this.resetToIdle();
		}

		if (this.order == Order.PatrolArea) {
			if (!this.isMoving) this.orderToPatrolInArea(); 
		}

		if (this.isFighter && (this.order == Order.Guard || this.order == Order.AttackMoveToPoint || this.order == Order.PatrolArea)) {
			const nearestUnit = FindNearestEnemyUnit(this, FIGHER_SEARCH_RANGE);
			if (nearestUnit) this.orderMoveToAttackUnit(nearestUnit);
		}

		if (this.isStaticDefense && this.order == Order.Guard) {
			const nearestUnit = FindNearestEnemyUnit(this, this.attackRange);
			if (nearestUnit) {
				this.targetUnit = nearestUnit;
				this.order = Order.AttackUnit;
			}
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
	buildBarElement = document.getElementById("buildBar");
	[Type.ResourceDepot, Type.PowerExtender, Type.StaticDefense].forEach(type => {
		const unitTypeData = GetUnitTypeData(type);
		const trainButtonElm = document.createElement("button");
		trainButtonElm.innerText = unitTypeData.name;
		trainButtonElm.dataset.tooltip = unitTypeData.tooltip;
		trainButtonElm.dataset.constructType = type;
		buildBarElement.appendChild(trainButtonElm);
	})

	unitInfoElement = document.getElementById("unitInfo");
	tooltipElement = document.getElementById("tooltip");
	trainButtonsElement = document.getElementById("trainButtons");
	statusBarElement = document.getElementById("statusBar");
	minimapElement = document.getElementById("minimap");
	worldElement = document.getElementById("world");
	uiElement = document.getElementById("ui");
	eventInfoElement = document.getElementById("eventInfo");
	buildingPlacementGhostElement = document.getElementById("buildingPlacementGhost");
	customElements.define(UNIT_SELECTOR, UnitElement);
	customElements.define(SPRITE_SELECTOR, SpriteElement);
	customElements.define(OVERLAY_SELECTOR, OverlayElement);
	worldElement.style.width = px(WORLD_SIZE);
	worldElement.style.height = px(WORLD_SIZE);
	PlayerResources[PLAYER_HUMAN] = 100;
	window.setInterval(UpdateMinimap, 100);
	UpdateMinimap();
	eventInterval = window.setInterval(CreateNewGameEvent, GAME_EVENT_INTERVAL);

	CreateUnit(Type.ResourceNode, PLAYER_NEUTRAL, WORLD_SIZE/2 - 250, WORLD_SIZE/2 + 200);
	CreateUnit(Type.ResourceNode, PLAYER_NEUTRAL, WORLD_SIZE/2 + 200, WORLD_SIZE/2 - 250);
	CreateUnit(Type.ResourceNode, PLAYER_NEUTRAL, WORLD_SIZE/2 - 220, WORLD_SIZE/2 + 100);
	CreateUnit(Type.ResourceNode, PLAYER_NEUTRAL, WORLD_SIZE/2 + 250, WORLD_SIZE/2 - 150);
	CreateUnit(Type.ResourceNode, PLAYER_NEUTRAL, WORLD_SIZE/2 + 150, WORLD_SIZE/2 + 250);
	HumanPlayerTownHall = CreateUnit(Type.ResourceDepot, PLAYER_HUMAN, WORLD_SIZE/2, WORLD_SIZE/2);
	CreateUnit(Type.StaticDefense, PLAYER_HUMAN, WORLD_SIZE/2 + TILE*4, WORLD_SIZE/2 + TILE*4);
	CreateUnit(Type.Harvester, PLAYER_HUMAN, WORLD_SIZE/2 + 100, WORLD_SIZE/2 + 100);
	CreateUnit(Type.Harvester, PLAYER_HUMAN, WORLD_SIZE/2 + 100, WORLD_SIZE/2 - 100);
	CreateUnit(Type.Harvester, PLAYER_HUMAN, WORLD_SIZE/2 - 100, WORLD_SIZE/2 + 100);

	for (var i = 0; i < 100; i++) {
		CreateUnit(Type.ResourceNode, PLAYER_NEUTRAL, Math.random() * WORLD_SIZE, Math.random() * WORLD_SIZE);
	}

	for (var i = 0; i < 10; i++) {
		const unit = CreateUnit(Type.Fighter, PLAYER_ENEMY, Math.random() * WORLD_SIZE, Math.random() * WORLD_SIZE);
		unit.orderToPatrolInArea();
	}

	window.requestAnimationFrame(Tick);
	// CreateUnit(Type.StaticDefense, PLAYER_HUMAN, 550, 350);
	// CreateUnit(Type.Harvester, PLAYER_ENEMY, 650, 450);
}

function Log(...args) {
	unitInfoElement.innerHTML = args.join("<br>");
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

function GetAllPowerGenerators(playerID) {
	const units = Array.from(GetAllUnits())
	.filter((unitElm) => { return unitElm.playerID == playerID})
	.filter((unitElm) => { return unitElm.providesPower});
	return units;
}

function FindNearestUnitOfType(originUnitElm, type, searchRange, samePlayerRequirement = false) {
	const nearestUnit = Array.from(GetAllUnits())
	.filter((unitElm) => { return samePlayerRequirement ? (originUnitElm.playerID == unitElm.playerID) : true })
	.filter((unitElm) => { return  unitElm.type == type })
	.filter((unitElm) => { return unitElm.distanceToUnit(originUnitElm) < searchRange })
	.sort((a, b) => { return a.distanceToUnit(originUnitElm) - b.distanceToUnit(originUnitElm); })
	if (nearestUnit.length == 0) return null;
	else return nearestUnit[0];
}

function FindNearestEnemyUnit(originUnitElm, searchRange) {
	const nearestUnit = Array.from(GetAllUnits())
	.filter((unitElm) => { return !unitElm.isNeutral && unitElm.playerID != originUnitElm.playerID })
	.filter((unitElm) => { return unitElm.distanceToUnit(originUnitElm) < searchRange })
	.sort((a, b) => { return a.priority - b.priority; })
	.sort((a, b) => { return a.distanceToUnit(originUnitElm) - b.distanceToUnit(originUnitElm); })
	if (nearestUnit.length == 0) return null;
	else return nearestUnit[0];
}

function CreateUnit(type, playerID, x, y) {
	const unitElm = document.createElement(UNIT_SELECTOR);
	unitElm.Setup(type, playerID);
	worldElement.appendChild(unitElm);
	unitElm.Move(x,y);
	unitElm.Awake();
	return unitElm;
}

function DisplayErrorMessage(message) {
	log(message);
}

function ConstructBuilding(type, playerID, x, y) {
	const unitData = GetUnitTypeData(type);
	if (PlayerResources[playerID] < unitData.cost) {
		DisplayErrorMessage("Not enough resources");
		return false;
	}
	var powered = GetAllPowerGenerators(playerID).some(elm => {return elm.providesPowerAtPoint(x,y)});
	if (!powered) {
		DisplayErrorMessage("Need to place in powered area");
		return false;
	}
	PlayerResources[playerID] -= unitData.cost;
	CreateUnit(type, playerID, x, y);
	return true;
}

function CreateUnitsInArea(num, type, playerID, x, y) {
	const units = Array();
	const spread = 3 * TILE;
	for (var i = 0; i < num; i++) {
		const spawnX = x - spread + Math.random()*spread;
		const spawnY = y - spread + Math.random()*spread;
		units.push(CreateUnit(type, playerID, spawnX, spawnY));
	}
	return units;
}

function UpdateMinimap() {
	minimapElement.innerHTML = "";
	GetAllUnits().forEach(unitElm => {
		const mElm = document.createElement("div");

		mElm.style.left = px(unitElm.centerX/MINIMAP_SCALE);
		mElm.style.top = px(unitElm.centerY/MINIMAP_SCALE);
		mElm.className = unitElm.className;
		mElm.dataset.player = unitElm.dataset.player;
		minimapElement.appendChild(mElm);
	});

	const viewportElm = document.createElement("span");
	viewportElm.style.left = px(window.scrollX/MINIMAP_SCALE);
	viewportElm.style.top = px(window.scrollY/MINIMAP_SCALE);
	viewportElm.style.width = px(window.innerWidth/MINIMAP_SCALE);
	viewportElm.style.height = px(window.innerHeight/MINIMAP_SCALE);
	minimapElement.appendChild(viewportElm);
}

function UpdateUnitInfo(force=false) {
	const selectedUnit = GetSelectedUnit();
	// if (CurrentDisplayUnit != selectedUnit)
	const render = function(...args) {
		unitInfoElement.innerHTML = args.join("<br>");
	}
	if (CurrentDisplayUnit && !CurrentDisplayUnit.isActive) {
		CurrentDisplayUnit = null;
		unitInfoElement.innerHTML = "";
		trainButtonsElement.innerHTML = "";
		return;
	}

	if (selectedUnit && (force || CurrentDisplayUnit != selectedUnit)) {
		CurrentDisplayUnit = selectedUnit;
		unitInfoElement.innerHTML = "";
		trainButtonsElement.innerHTML = "";

		if (CurrentDisplayUnit.isHarvester) render(CurrentDisplayUnit, `${CurrentDisplayUnit.hp} hp`, CurrentDisplayUnit.order, `${CurrentDisplayUnit.targetX}, ${CurrentDisplayUnit.targetY}`, CurrentDisplayUnit.targetUnit, CurrentDisplayUnit.previousResourceNode, CurrentDisplayUnit.resourceCarryAmount, `${CurrentDisplayUnit.cooldown}/${CurrentDisplayUnit.cooldownMax}`);
		else if (CurrentDisplayUnit.isFighter) render(CurrentDisplayUnit, `${CurrentDisplayUnit.hp} hp`, CurrentDisplayUnit.order, `${CurrentDisplayUnit.targetX}, ${CurrentDisplayUnit.targetY}`, CurrentDisplayUnit.targetUnit, `${CurrentDisplayUnit.cooldown}/${CurrentDisplayUnit.cooldownMax}`);
		else if (CurrentDisplayUnit.isResourceNode) render(CurrentDisplayUnit, CurrentDisplayUnit.order, `${CurrentDisplayUnit.targetX}, ${CurrentDisplayUnit.targetY}`, CurrentDisplayUnit.targetUnit, CurrentDisplayUnit.remainingResources);
		else if (!CurrentDisplayUnit.isMobile) render(CurrentDisplayUnit, `${CurrentDisplayUnit.hp} hp`, CurrentDisplayUnit.order);
		else render(CurrentDisplayUnit, CurrentDisplayUnit.order, `${CurrentDisplayUnit.targetX}, ${CurrentDisplayUnit.targetY}`, CurrentDisplayUnit.targetUnit);

		if (CurrentDisplayUnit.unitsTrained) {
			CurrentDisplayUnit.unitsTrained.forEach(type => {
				const unitTypeData = GetUnitTypeData(type);
				const trainButtonElm = document.createElement("button");
				trainButtonElm.innerText = unitTypeData.name;
				trainButtonElm.dataset.trainType = type;
				trainButtonElm.dataset.tooltip = unitTypeData.tooltip;
				trainButtonsElement.appendChild(trainButtonElm);
			})
		}
	}
}

function CreateNewGameEvent(id = null) {

	const eventKeys = Object.keys(GameEvent);
	// TODO randomize with weights
	if (!id) id = eventKeys[parseInt(Math.random() * eventKeys.length - 1)];
	const newEvent =  GetGameEvent(id);
	GameEvents.push(newEvent);
	// TODO ping mini map

	const eventElement = document.createElement("span");
	eventElement.innerText = newEvent.message;

	if (newEvent.id == GameEvent.PirateInvasion) {
		const units = CreateUnitsInArea(2, Type.Fighter, PLAYER_ENEMY, WORLD_SIZE*0.9, WORLD_SIZE*0.9);
		units.forEach(unitElm => unitElm.orderAttackMoveToPoint(HumanPlayerTownHall.centerX, HumanPlayerTownHall.centerY))
	}

	if (newEvent.id == GameEvent.AlienInvasion) {
		const units = CreateUnitsInArea(3, Type.Fighter, PLAYER_ENEMY, Math.random() * WORLD_SIZE, Math.random() * WORLD_SIZE);
		units.forEach(unitElm => unitElm.orderToPatrolInArea())
	}

	eventInfoElement.appendChild(eventElement);
}

function Tick(ms) {
	document.querySelectorAll(UNIT_SELECTOR).forEach(unitElm => unitElm.update());

	tooltipElement.classList.toggle("visible", TooltipDisplaying);
	tooltipElement.style.left = px(mouseClientX);
	tooltipElement.style.top = px(mouseClientY);

	document.body.classList.toggle("showPowerRange", CurrentBuildingPlaceType);
	buildingPlacementGhostElement.classList.toggle("visible", CurrentBuildingPlaceType);
	if (CurrentBuildingPlaceType) {
		CurrentBuildingPlacemenValid = GetAllPowerGenerators(PLAYER_HUMAN).some(elm => {return elm.providesPowerAtPoint(mousePlaceX,mousePlaceY)});
		buildingPlacementGhostElement.classList.toggle("valid", CurrentBuildingPlacemenValid);
		buildingPlacementGhostElement.style.left = px(mousePlaceX);
		buildingPlacementGhostElement.style.top = px(mousePlaceY);
	}

	statusBarElement.innerText = `💎 ${PlayerResources[PLAYER_HUMAN]}`;
	UpdateUnitInfo();

	var scrollX = 0;
	var scrollY = 0;
	if (mouseClientX >= window.innerWidth - TILE * 2) scrollX += TILE/2;
	if (mouseClientX <= TILE * 2) scrollX -= TILE/2;
	if (mouseClientY >= window.innerHeight - TILE * 2) scrollY += TILE/2;
	if (mouseClientY <= TILE * 2) scrollY -= TILE/2;
	if (scrollX != 0 || scrollY != 0) window.scrollBy(scrollX, scrollY);

	window.requestAnimationFrame(Tick);
}

document.addEventListener("DOMContentLoaded", evt => {

	document.addEventListener("click", evt => {
		if (!evt.target) return;

		if (evt.target.id == "mainMenuButton") {
			console.log("MENU");
		}

		if (evt.target.tagName.toLowerCase() == "button") {
			if (evt.target.dataset.constructType) CurrentBuildingPlaceType = evt.target.dataset.constructType;
			if (evt.target.dataset.trainType && CurrentDisplayUnit) CurrentDisplayUnit.trainUnit(evt.target.dataset.trainType);
			return;
		}

		if (CurrentBuildingPlaceType) {
			if (ConstructBuilding(CurrentBuildingPlaceType, PLAYER_HUMAN, mousePlaceX, mousePlaceY)) {
				CurrentBuildingPlaceType = null;	
			}
			return;
		}


		if (UnitElement.isElementUnit(evt.target)) {
			if (!evt.shiftKey) DeselectAllUnits();
			evt.target.select();
		} else if (evt.target == minimapElement) {
			window.scrollTo(evt.offsetX * MINIMAP_SCALE - window.innerWidth/2, evt.offsetY * MINIMAP_SCALE - window.innerHeight/2);
			// log(evt);
			UpdateMinimap();
		}
	});

	document.addEventListener("mousedown", evt => mouseDown = true);
	document.addEventListener("mouseup", evt => mouseDown = false);

	document.addEventListener("mouseover", evt => {
		if (evt.target.tagName.toLowerCase() == "button" && evt.target.dataset.tooltip) {
			tooltipElement.innerHTML = evt.target.dataset.tooltip;
			TooltipDisplaying = true;
		}
	});
	document.addEventListener("mouseout", evt => TooltipDisplaying = false);

	document.addEventListener("mousemove", evt => {
		mouseX = evt.pageX;
		mouseY = evt.pageY;
		mousePlaceX = Math.floor(mouseX/TILE)*TILE;
		mousePlaceY = Math.floor(mouseY/TILE)*TILE;
		mouseClientX = evt.clientX;
		mouseClientY = evt.clientY;

		if (mouseDown && evt.target == minimapElement) {
			window.scrollTo(evt.offsetX * MINIMAP_SCALE - window.innerWidth/2, evt.offsetY * MINIMAP_SCALE - window.innerHeight/2);
			UpdateMinimap();
		}
	})

	document.addEventListener("keyup", evt => {
		Object.keys(UnitTypeData).forEach(type => {
			if (evt.key.toLowerCase() == GetUnitTypeData(type).hotkey) {
				const data = GetUnitTypeData(type);
				if (data.isBuilding) {
					CurrentBuildingPlaceType = type;
				} else {
					if (evt.shiftKey) {
						CreateUnit(type, evt.ctrlKey ? PLAYER_ENEMY : PLAYER_HUMAN, mouseX, mouseY)
					} else {
						const selectedUnit = GetSelectedUnit();
						if (selectedUnit) selectedUnit.trainUnit(UnitTypeData[type].type);
						else log("No selected unit. Hold shift to spawn");
					}
				}
			}
		});
	});

	document.addEventListener("contextmenu", evt => {
		evt.preventDefault();
		if (CurrentBuildingPlaceType) CurrentBuildingPlaceType = null;
		const targetUnitElm = evt.target;
		GetSelectedUnits().forEach(unitElm => {
			if (unitElm.isMobile) {
				if (!evt.target || !UnitElement.isElementUnit(evt.target)) {
					if (evt.ctrlKey) unitElm.orderAttackMoveToPoint(evt.pageX, evt.pageY);
 					else unitElm.orderMoveToPoint(evt.pageX, evt.pageY);
				}
				else unitElm.orderInteractWithUnit(evt.target);
			}
		})
	});


	SetupGame();
});