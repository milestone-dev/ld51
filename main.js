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

const DEBUG_MODE = false;
const FPS = 30;
const AUDIO_MAX_INSTANCES = 3;
const UNIT_SELECTOR = "x-unit";
const SPRITE_SELECTOR = "x-sprite";
const OVERLAY_SELECTOR = "x-overlay";
const TILE = 32;
const UNIT_SIZE_SMALL = 24;
const UNIT_SIZE_MEDIUM = 48;
const UNIT_SIZE_LARGE = 64;
const UNIT_SIZE_XLARGE = 128;
const STOPPING_RANGE = TILE/2;
const GAME_EVENT_THRESHOLD = 10000;
const MINING_RANGE = UNIT_SIZE_LARGE / 2;
const PLAYER_NEUTRAL = 0;
const MINING_SEARCH_RANGE = TILE * 100;
const FIGHER_SEARCH_RANGE = TILE * 15;
const PLAYER_HUMAN = 1;
const PLAYER_ENEMY = 2;
const PATROL_RANGE = TILE*8;
const MINIMAP_SCALE = 64;
const WORLD_SIZE = 128*64;
const EXPLOSION_SPRITE_TIMEOUT = 300;
const MINIMAP_PING_TIMEOUT = 2000;
const GAME_UI_REFRESH_INTERVAL = 500;
const UNIT_DEFAULT_VISION = TILE*4;
const MESSAGE_HIDE_TIMEOUT = 3000;
const USE_FOW = false;
const SVGNS = "http://www.w3.org/2000/svg";
const RESOURCE_GOAL = 100000;
const PLAYER_START_RESOURCES = 50;


const RESOURCE_CARRY_AMOUNT_MAX = 8;

const Type = {
	Undefined: "Undefined",
	ResourceNode: "ResourceNode",
	ResourceDepot: "ResourceDepot",
	StaticDefense: "StaticDefense",
	PowerExtender: "PowerExtender",
	Harvester: "Harvester",
	Interceptor: "Interceptor",
	Destroyer: "Destroyer",
	Artefact: "Artefact",
	DerelictStation: "DerelictStation",
	AlienAffliction: "AlienAffliction",
	AlienGorger: "AlienGorger",
	PirateRaider: "PirateRaider",
	PirateMarauder: "PirateMarauder",
}

var EnemyPlayers = 0;
const UnitTypeData = {};
//{type, name, hotkey, icon, size, cost, elevation, buildTime, hp, priority, powerRange, moveSpeed, attackRange, attackDamage, visionRange, cooldownMax, unitsTrained = []}
function AddUnitTypeData(type, name, hotkey, icon, tooltip, size, data = {}) {
	UnitTypeData[type] = {type, name, hotkey, icon, tooltip, size};
	Object.keys(data).forEach(key => UnitTypeData[type][key] = data[key]);
	if (!data.visionRange) UnitTypeData[type].visionRange = UNIT_DEFAULT_VISION;
	if (!data.ackResponses) UnitTypeData[type].ackResponses = 0;
	if (!data.whatResponses) UnitTypeData[type].visionRange = 0;
	if (!data.attackHitSprite) UnitTypeData[type].attackHitSprite = "BeamHit";
	if (!data.explosionSprite) UnitTypeData[type].explosionSprite = "Explosion";
}
function GetUnitTypeData(unitType) { return UnitTypeData[unitType]; }
AddUnitTypeData(Type.Harvester, "Miner", "m", "👾", "Cost: 50. Primary harvest unit.", UNIT_SIZE_MEDIUM, {cost:50, elevation:1000, buildTime:30, hp:65, priority:100, visionRange:TILE*8, moveSpeed:1, attackRange:MINING_RANGE, cooldownMax:10});
AddUnitTypeData(Type.Interceptor, "Interceptor", "i", "🚀", "Cost: 50. Primary fighter unit.", UNIT_SIZE_MEDIUM, {cost:50, elevation:1000, buildTime:30, hp:110, priority:50, visionRange:TILE*12, moveSpeed:1.4, attackDamage:10, attackRange:TILE*10, cooldownMax:15});
// AddUnitTypeData(Type.Destroyer, "Destroyer", "d", "🚝", "Cost: 300. Heavy fighter unit.", UNIT_SIZE_LARGE, {cost:50, elevation:1000, buildTime:30, hp:400, priority:25, visionRange:TILE*12, moveSpeed:1, attackDamage:50, attackRange:TILE*6, cooldownMax:15});
AddUnitTypeData(Type.ResourceDepot, "Mining Base", "b", "🛰", "Cost: 400. Primary resource depot and harvester training facility.", UNIT_SIZE_XLARGE, {isBuilding:true, cost:400, visionRange:TILE*12, elevation:500, buildTime:30, hp:1000, priority:300, powerRange:TILE*10, unitsTrained:[Type.Harvester, Type.Interceptor]});
AddUnitTypeData(Type.PowerExtender, "Power Extender", "p", "📍", "Cost: 100. Extends power range to allow base expansion.", UNIT_SIZE_MEDIUM, {isBuilding: true, cost:100, elevation:500, visionRange:TILE*8, buildTime:30, hp:200, priority:100, powerRange:TILE*8});
AddUnitTypeData(Type.StaticDefense, "Defense Turret", "t", "🗼", "Cost: 200. Primary static defense structure.", UNIT_SIZE_MEDIUM, {isBuilding:true, cost:200, elevation:500, visionRange:TILE*15, buildTime:30, hp:600, priority:70, attackDamage:40, attackRange:TILE*10, cooldownMax:10});
AddUnitTypeData(Type.ResourceNode, "Asteroid", "n", "🪨", "", UNIT_SIZE_LARGE);
AddUnitTypeData(Type.Artefact, "Precursor Artefact", null, "🗿", "", UNIT_SIZE_SMALL);
AddUnitTypeData(Type.DerelictStation, "Derelict Station", "", "✈️", "", UNIT_SIZE_XLARGE);

AddUnitTypeData(Type.AlienAffliction, "Affliction", null, "🦇", "", UNIT_SIZE_SMALL, {elevation:1000, hp:75, priority:25, visionRange:TILE*12, moveSpeed:1.1, attackDamage:2, attackRange:TILE*6, cooldownMax:7, attackHitSprite:"VenomHit"});
// AddUnitTypeData(Type.AlienGorger, "Gorger", null, "🐉", "", UNIT_SIZE_LARGE, {elevation:1000, hp:100, priority:50, visionRange:TILE*12, moveSpeed:1, attackDamage:10, attackRange:TILE*6, cooldownMax:10});
AddUnitTypeData(Type.PirateRaider, "Raider", null, "🛸", "", UNIT_SIZE_MEDIUM, {elevation:1000, hp:90, priority:25, visionRange:TILE*12, moveSpeed:1.6, attackDamage:7, attackRange:TILE*4, cooldownMax:10, attackHitSprite:"LaserHit"});
// AddUnitTypeData(Type.PirateMarauder, "Marauder", null, "🛩", "", UNIT_SIZE_LARGE, {elevation:1000, hp:100, priority:50, visionRange:TILE*12, moveSpeed:1, attackDamage:10, attackRange:TILE*6, cooldownMax:10});

const GameEvent = {
	// NewResource: "NewResource",
	DerelictStation: "DerelictStation",
	// MapScan: "MapScan",
	PirateInvasion: "PirateInvasion",
	AlienInvasion: "AlienInvasion",
	RivalMiners: "RivalMiners",
	// WarpRift: "WarpRift",
	// IonStorm: "IonStorm",
	ArtefactDiscovery: "ArtefactDiscovery",
	Reinforcements: "Reinforcements",
	// MoraleBoost: "MoraleBoost",
	// MoraleLoss: "MoraleLoss",
	// NetworkError: "NetworkError",
} 
const GameEventData = {}
const GameEvents = [];
function AddGameEventData(id, message, weight) {GameEventData[id] = {id, message, weight}; }
function GetGameEvent(id) { return GameEventData[id]; }
AddGameEventData(GameEvent.NewResource, "A new resource has been discovered", 10);
AddGameEventData(GameEvent.DerelictStation, "A derelict star station has been discovered", 10);
AddGameEventData(GameEvent.MapScan, "Sector scanned", 10);
AddGameEventData(GameEvent.PirateInvasion, "Pirates vessels sighted in the sector", 10);
AddGameEventData(GameEvent.AlienInvasion, "Alien presence discovered", 10);
AddGameEventData(GameEvent.WarpRift, "Brace for warp rift", 10);
AddGameEventData(GameEvent.IonStorm, "Brace for incoming Ion storm", 10);
AddGameEventData(GameEvent.ArtefactDiscovery, "Precursor Artefact has been discoreved", 10);
AddGameEventData(GameEvent.Reinforcements, "Reinforcements have arrived", 10);
AddGameEventData(GameEvent.MoraleBoost, "Morale is surging. Worker speed increased by 10%.", 10);
AddGameEventData(GameEvent.MoraleLoss, "Worker morale has taken a hit. Worker speed decreased by 20%", 10);
AddGameEventData(GameEvent.NetworkError, "A long range frequency network outage has been discovered.", 10);
AddGameEventData(GameEvent.RivalMiners, "A rival mining team has entered the sector in search of riches", 10);

const Units = [];
const PlayerUnits = [[], [], [], []];
const SelectedUnits = [];
var UNIT_ID = 0;
var mouseX, mouseY, mouseDown, mousePlaceX, mousePlaceY, mouseClientX, mouseClientY;
var worldElement, uiElement, unitInfoElement, unitPortraitElement, trainButtonsElement, buildBarElement,
statusBarElement, minimapElement, eventInfoElement, buildingPlacementGhostElement,
fogContainerElement,fogMaskElement,fogContainerMMElement,fogMaskMMElement, 
minimapViewPortElement, selectionRectangleElement, mainMenuButtonElement,
mainMenuResumeButtonElement, mainMenuNewGameButtonElement, splashElement, victorySplashElement, messageBarElement;

var audioInstanceCount = 0;
var previousTime = 0;
var PlayerResources = [0, 0, 0, 0];
var eventInterval;
var HumanPlayerTownHall = null;
var CurrentBuildingPlaceType = null;
var CurrentDisplayUnit = null;
var CurrentBuildingPlacemenValid = false;
var TooltipDisplaying = false;
var SelectionRectangleDisplaying = false;
var SelectionRectangleTop = 0;
var SelectionRectangleLeft = 0;
var SelectionRectangleWidth = 0;
var SelectionRectangleHeight = 0;
var Paused = true;
var GameStarted = false;
var MusicAudio = null;
var Difficulty = 0;
var EventTimer = 0;
var MessageHideInterval = null;
var KeyADown = false;
var KeyWDown = false;
var KeySDown = false;
var KeyDDown = false;



const log = console.log;

function px(i) {return i+"px"};
function lerp(start, end, amt){ return (1-amt)*start+amt*end; }

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
		this._order = Order.Undefined;
		this.isMoving = false;
		this.moveSpeed = 0;
		this._hp = 1;
		this.targetUnit = null;
		this.targetX = Number.NaN;
		this.targetY = Number.NaN;
		this.patrolOriginX = Number.NaN;
		this.patrolOriginY = Number.NaN;
		this.centerX = 0;
		this.centerY = 0;
		this.destinationX = Number.NaN;
		this.destinationY = Number.NaN;
		this.radians = 0;
		this.visionElement = null;
		this.visionMMElement = null;
		this.minimapUnitElement = null;
		this.imageElement = null;

		// Harvester specific
		this.resourceCarryAmount = 0;
		this.previousResourceNode = null;
		this.remainingResources = 6000; // TODO move to data
	}

	get order() {return this._order;}
	set order(order) {
		const updated = (order != this._order && this.isSelected);
		this._order = order;
		if (updated) UpdateUnitInfo(true);
	}

	get hp() {return this._hp;}
	set hp(hp) {
		const updated = (hp != this._hp && this.isSelected);
		this._hp = hp;
		if (updated) UpdateUnitInfo(true);		
	}

	Setup(type, playerID) {
		this.id = `unit-${UNIT_ID++}`;
		this.type = type;
		if (type == Type.ResourceNode || type == Type.Artefact) playerID = PLAYER_NEUTRAL;
		this.playerID = playerID;
		const data = GetUnitTypeData(this.type);
		Object.keys(data).forEach(key => this[key] = data[key]);
		this.style.width = px(data.size);
		this.style.height = px(data.size);
		this.style.lineHeight = px(data.size);
		this.style.fontSize = px(data.size);
		this.style.zIndex = data.elevation;
		// this.innerText = data.icon;
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

		if (USE_FOW) {
			if (this.playerID == PLAYER_HUMAN) {
				this.visionElement = document.createElementNS(SVGNS, "circle");
				this.visionElement.setAttribute("r", this.visionRange);
				this.visionElement.setAttribute("fill", "black");
				fogMaskElement.appendChild(this.visionElement);

				this.visionMMElement = document.createElementNS(SVGNS, "circle");
				this.visionMMElement.setAttribute("r", this.visionRange/MINIMAP_SCALE);
				this.visionMMElement.setAttribute("fill", "black");
				fogMaskMMElement.appendChild(this.visionMMElement);
			}
			
		}

		this.imageElement = document.createElement("img");
		this.imageElement.src = `img/sprite_${this.type}.png`;
		this.appendChild(this.imageElement);

		this.minimapUnitElement = document.createElement("div");
		this.minimapUnitElement.dataset.player = this.playerID;
		minimapElement.appendChild(this.minimapUnitElement);

	}

	toString() {
		return `P${this.playerID} ${this.name}`;
	}

	connectedCallback() {
	}

	Move(x, y) {
		this.centerX = Math.round(x);
		this.centerY = Math.round(y);
	}

	Awake() {
		if (this.isHarvester) this.harvestNearbyResources();
	}

	get isActive() {return this.parentNode != null; }
	get isMobile() {return this.moveSpeed > 0; }
	get isNeutral() {return this.playerID == PLAYER_NEUTRAL; }
	get isHarvester() {return this.type == Type.Harvester; }
	get isPowerup() {return this.type == Type.Artefact || this.type == Type.DerelictStation; }
	get isAttackingUnit() {return this.attackDamage > 0; }
	get isStaticDefense() {return this.type == Type.StaticDefense; }
	get isResourceNode() {return this.type == Type.ResourceNode; }
	get isResoruceDepot() {return this.type == Type.ResourceDepot; }
	get providesPower() {return this.powerRange > 0; }
	get requiresPower() {return this.isBuilding; }
	get isSingleSelect() {return this.isBuilding;}
	get portraitImage() {return `img/portrait_${this.type}.png`;}

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

	select() {
		if (SelectedUnits.includes(this)) return;
		SelectedUnits.push(this);
		this.classList.add("selected");
		if (this.minimapUnitElement) this.minimapUnitElement.classList.add("selected");
	}

	playWhatAudio() {
		if (this.playerID == PLAYER_HUMAN) {
			if (this.whatResponses > 0) PlayAudio(`response_${this.type}_what0${Math.round(Math.random()*this.whatResponses)}`);
			else PlayAudio(`response_Default_what00`);
		}
	}

	playAckAudio() {
		if (this.playerID == PLAYER_HUMAN) {
			if (this.ackResponses > 0) PlayAudio(`response_${this.type}_ack0${Math.round(Math.random()*this.ackResponses)}`);
			else PlayAudio(`response_Default_ack00`);
		}
	}

	playReadyAudio() {
		if (this.playerID == PLAYER_HUMAN) PlayAudio(`response_${this.type}_ready`);
	}

	playAttackAudio() {
		// TODO: Check nearby
		switch (this.type) {
			case Type.AlienAffliction:
			case Type.AlienGorger:
				PlayAudio(`attack_Venom`)
				break;
			default:
				PlayAudio(`attack_Laser`);
				break;
		}
	}

	get isSelected() {
		return !!this.classList.contains("selected");
	}

	deselect() {
		const index = SelectedUnits.indexOf(this);
		if (index != -1) SelectedUnits.splice(index, 1);
		this.classList.remove("selected");
		if (this.minimapUnitElement) this.minimapUnitElement.classList.remove("selected");
	}

	travelToPoint(orderX, orderY) {
		if (this.moveSpeed == 0) return;

		this.destinationX = orderX;
		this.destinationY = orderY;

		//OLD
		// const r = this.getBoundingClientRect();
		// const distance = this.distanceToPoint(orderX,orderY);
		// const moveDuration = distance / this.moveSpeed;
		// this.style.transitionDuration = moveDuration + "s";
		// this.style.left = px(orderX - r.width/2);
		// this.style.top = px(orderY - r.height/2);
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
			// log("unhandled orderInteractWithUnit");
		}
	}

	stopTravelling() {
		this.destinationX = Number.NaN;
		this.destinationY = Number.NaN;
	}

	stop() {
		this.stopTravelling();
		this.order = Order.Idle;
	}

	destroy() {
		this.hp = 0;
		this.deselect();
		if (this.visionElement) this.visionElement.remove();
		if (this.minimapUnitElement) this.minimapUnitElement.remove();
		PlayerUnits[this.playerID].splice(PlayerUnits[this.playerID].indexOf(this), 1);
		Units.splice(Units.indexOf(this), 1);
		this.remove();
		UpdateUnitInfo(true)
	}

	facePoint(x,y) {
		const atan = Math.atan2(y - this.centerY, x - this.centerX) + Math.PI/2
		this.radians = atan;
	}

	harvestNearbyResources() {
		var resourceNode = this.previousResourceNode;
		if (!this.previousResourceNode || !this.previousResourceNode.isActive || this.previousResourceNode.remainingResources == 0) resourceNode = FindNearestUnitOfType(this, Type.ResourceNode, MINING_SEARCH_RANGE)
		if (resourceNode) this.orderToHarvestResourceUnit(resourceNode);
		else {
			// log("Unable to find nearby resources, idling.")
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
			const unit = CreateUnit(unitType, this.playerID, this.centerX, this.centerY);
			unit.playReadyAudio();
		} else {
			DisplayErrorMessage("Not enough resources");
		}
	}

	createSpriteEffect(type, animation = "explosion") {
		const elm = document.createElement(SPRITE_SELECTOR);
		elm.classList.add(animation);
		var imgElm = document.createElement("img");
		imgElm.src = `img/sprite_${type}.png`;
		elm.appendChild(imgElm);
		this.appendChild(elm);
	}

	pickupUnit(unitElm) {
		if (!unitElm.isPowerup) return;
		// TODO add bonus for retrieval
		if (unitElm.type == Type.Artefact) PlayerResources[this.playerID] += 500;
		else if (unitElm.type == Type.DerelictStation) PlayerResources[this.playerID] += 1000;
		if (this.visionElement) this.visionElement.remove();
		unitElm.destroy();
	}

	get transform() {

		return `translate3d(${px(Math.round(this.centerX-this.size/2))}, ${px(Math.round(this.centerY-this.size/2))}, 0px)`;
	}

	get minimapTransform() {
		return `translate3d(${px(this.centerX/MINIMAP_SCALE)}, ${px(this.centerY/MINIMAP_SCALE)}, 0)`;
	}

	get imageTransform() {
		return `rotate(${this.radians}rad)`;
	}

	Update(deltaTime=1) {
		if (this.hp <= 0) this.destroy();

		if ((this.isAttackingUnit || this.isStaticDefense) && this.order == Order.Idle) this.order = Order.Guard;
		if (this.targetUnit && !this.targetUnit.isActive) this.targetUnit = null;
		if (this.previousResourceNode && !this.previousResourceNode.isActive) this.previousResourceNode = null;


		if (!Number.isNaN(this.destinationX)) {
			this.isMoving = true;
		    var deltaX = this.destinationX - this.centerX;
		    if (Math.abs(deltaX) > TILE/10) {
			    deltaX = deltaX / Math.sqrt(deltaX * deltaX);
			    this.centerX += Math.round(deltaX * this.moveSpeed * deltaTime);
		    } else {
		    	this.destinationX = Number.NaN;
		    }
		}

		if (!Number.isNaN(this.destinationY)) {
			this.isMoving = true;
		    var deltaY = this.destinationY - this.centerY;
		    if (Math.abs(deltaY) > TILE/10) {
			    deltaY = deltaY / Math.sqrt(deltaY * deltaY);
			    this.centerY += Math.round(deltaY * this.moveSpeed * deltaTime);
		    } else {
		    	this.destinationY = Number.NaN;
		    }
		}

		this.isMoving = (!Number.isNaN(this.destinationX) || !Number.isNaN(this.destinationY));


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
		} else if (this.order == Order.AttackMoveToPoint) {
			//
		} else if (this.order == Order.MoveToAttackUnit) {
			if (this.targetUnit && this.targetUnit.isActive) {
				if (this.distanceToUnit(this.targetUnit) < this.attackRange) {
					this.stopTravelling();
					this.order = Order.AttackUnit;
				} else {
					this.travelToPoint(this.targetUnit.centerX, this.targetUnit.centerY);
				}
			}
			else this.resetToIdle();
		} else if (this.order == Order.HarvestResourceNode || this.order == Order.AttackUnit || this.order == Order.Idle || this.order == Order.Guard || this.order == Order.PatrolArea) {
			// Pass
		} else {
			log("Did not manage order", this.order);
			this.resetToIdle();
		}

		// TRANSFORM
		if (this.style.transform != this.transform) {
			this.style.transform = this.transform;
			this.minimapUnitElement.style.transform = this.minimapTransform;
		}
		if (this.imageElement.style.transform != this.imageTransform) {
			this.imageElement.style.transform = this.imageTransform;
		}
		// if (this.visionElement && this.visionMMElement) {
		// 	this.visionElement.setAttribute("cx", this.centerX);
		// 	this.visionElement.setAttribute("cy", this.centerY);
		// 	this.visionMMElement.setAttribute("cx", this.centerX/MINIMAP_SCALE);
		// 	this.visionMMElement.setAttribute("cy", this.centerY/MINIMAP_SCALE);
		// }

		if (this.order == Order.HarvestResourceNode) {
			if (this.resourceCarryAmount < RESOURCE_CARRY_AMOUNT_MAX) {
				// Can carry more resources, continue harvesting
				if (this.targetUnit && this.targetUnit.isActive && this.targetUnit.isResourceNode && this.targetUnit.remainingResources > 0) {
					if (this.cooldown <= 0) {
						this.targetUnit.createSpriteEffect("MineBeam");
						this.resourceCarryAmount += 1;
						this.targetUnit.remainingResources -= 1;
						this.cooldown = this.cooldownMax;
					} else this.cooldown--;
				} else {
					// Look for more resources, otherwise return to home.
					// log("Tring to mine a resource node that is now gone, find another one");
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
					this.playAttackAudio();
					if (this.attackHitSprite) this.targetUnit.createSpriteEffect(this.attackHitSprite);
					this.targetUnit.hp -= this.attackDamage;
					this.cooldown = this.cooldownMax;
				} else this.cooldown--;
			} else this.resetToIdle();
		}

		if (this.order == Order.PatrolArea) {
			if (!this.isMoving) this.orderToPatrolInArea(); 
		}

		// Acquire a new target
		if (this.isAttackingUnit && (this.order == Order.Guard || this.order == Order.AttackMoveToPoint || this.order == Order.PatrolArea)) {

			if (this.isStaticDefense) {
				const nearestUnit = FindNearestEnemyUnit(this, this.attackRange);
				if (nearestUnit) {
					this.targetUnit = nearestUnit;
					this.order = Order.AttackUnit;
				}
			} else {
				const nearestUnit = FindNearestEnemyUnit(this, FIGHER_SEARCH_RANGE);
				if (nearestUnit) this.orderMoveToAttackUnit(nearestUnit);
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

	// Minimap
	minimapElement = document.getElementById("minimap");
	fogContainerMMElement = document.getElementById("fogContainerMM");
	fogMaskMMElement = document.getElementById("fogMaskMM");
	minimapViewPortElement = document.createElement("span");
	minimapElement.appendChild(minimapViewPortElement);
	fogContainerMMElement.width = WORLD_SIZE/MINIMAP_SCALE;
	fogContainerMMElement.height = WORLD_SIZE/MINIMAP_SCALE;
	fogContainerMMElement.setAttribute("viewBox", `0 0 ${WORLD_SIZE/MINIMAP_SCALE} ${WORLD_SIZE/MINIMAP_SCALE}`);

	unitInfoElement = document.getElementById("unitInfo");
	unitPortraitElement = document.getElementById("unitPortrait");
	tooltipElement = document.getElementById("tooltip");
	selectionRectangleElement = document.getElementById("selectionRectangle");
	trainButtonsElement = document.getElementById("trainButtons");
	statusBarElement = document.getElementById("statusBarText");
	worldElement = document.getElementById("world");
	uiElement = document.getElementById("ui");
	eventInfoElement = document.getElementById("eventInfo");
	fogContainerElement = document.getElementById("fogContainer");
	fogMaskElement = document.getElementById("fogMask");
	
	messageBarElement = document.getElementById("messageBar");
	splashElement = document.getElementById("splash");
	victorySplashElement = document.getElementById("victorySplash");
	mainMenuButtonElement = document.getElementById("mainMenuButton");
	mainMenuNewGameButtonElement = document.getElementById("mainMenuNewGameButton");
	mainMenuResumeButtonElement = document.getElementById("mainMenuResumeButton");
	
	buildingPlacementGhostElement = document.getElementById("buildingPlacementGhost");
	customElements.define(UNIT_SELECTOR, UnitElement);
	customElements.define(SPRITE_SELECTOR, SpriteElement);
	customElements.define(OVERLAY_SELECTOR, OverlayElement);
	worldElement.style.width = px(WORLD_SIZE);
	worldElement.style.height = px(WORLD_SIZE);
	fogContainerElement.width = WORLD_SIZE;
	fogContainerElement.height = WORLD_SIZE;
	fogContainerElement.setAttribute("viewBox", `0 0 ${WORLD_SIZE} ${WORLD_SIZE}`);

	if (!USE_FOW) {
		fogContainerElement.remove();
		fogContainerMMElement.remove();
	}

	MusicAudio = new Audio(`./audio/music_01.mp3`);
	MusicAudio.loop = true;

	// Core loops
	window.setInterval(UpdateUI, GAME_UI_REFRESH_INTERVAL);
	window.setInterval(UpdateMinimap, 100);
	window.setInterval(e => {if (!Paused) EventTimer += 100}, 100);
	window.requestAnimationFrame(Tick);
}

function EnterMainMenu() {
	splashElement.remove();
	MusicAudio.play();
}

function LoseGame() {
	GameStarted = false;
	Pause();
}

function StartNewGame() {
	Units.forEach(unitElm => unitElm.destroy());
	GameStarted = true;
	Difficulty = 0;
	EventTimer = 0;
	Units.forEach(unitElm => unitElm.destroy());
	window.setTimeout(e => window.scrollTo(WORLD_SIZE/2 - window.innerWidth/2, WORLD_SIZE/2 - window.innerHeight/2), 100);

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
	Resume();
	UpdateMinimap();
	UpdateUI();
	PlayerResources[PLAYER_HUMAN] = PLAYER_START_RESOURCES;
}

function Log(...args) {
	unitInfoElement.innerHTML = args.join("<br>");
}

function GetRandomWorldPoint() {
	var point = Math.random() * WORLD_SIZE;
	return point;
}

function GetRandomWorldPointAtEdge() {
	var point = Number.NaN;
	while (Number.isNaN(point) || (point > WORLD_SIZE / 10 && point < WORLD_SIZE - WORLD_SIZE / 10)) point = Math.random() * WORLD_SIZE;
	return point;
}

function GetRandomWorldPointNearEdge() {
	var point = Number.NaN;
	while (Number.isNaN(point) || (point > WORLD_SIZE / 5 && point < WORLD_SIZE - WORLD_SIZE / 5)) point = Math.random() * WORLD_SIZE;
	return point;
}

function GetSelectedUnits() {
	return SelectedUnits;
}

function IsUnitSelected(unitElm) {
	return SelectedUnits.indexOf(unitElm) != -1;
}

function GetSelectedUnit() {
	return SelectedUnits.length > 0 ? SelectedUnits[0] : null;
}

function DeselectAllUnits() {
	SelectedUnits.forEach(unitElm => {
		unitElm.classList.remove("selected");
		unitElm.minimapUnitElement.classList.remove("selected");
	});
	SelectedUnits.length = 0;
}

function GetAllPlayerUnits(playerID) {
	return PlayerUnits[playerID];
}

function GetAllPowerGenerators(playerID) {
	const units = Units
	.filter((unitElm) => { return unitElm.playerID == playerID})
	.filter((unitElm) => { return unitElm.providesPower});
	return units;
}

function FindNearestUnitOfType(originUnitElm, type, searchRange, samePlayerRequirement = false) {
	const nearestUnit = Units
	.filter((unitElm) => { return samePlayerRequirement ? (originUnitElm.playerID == unitElm.playerID) : true })
	.filter((unitElm) => { return  unitElm.type == type })
	.filter((unitElm) => { return unitElm.distanceToUnit(originUnitElm) < searchRange })
	.sort((a, b) => { return a.distanceToUnit(originUnitElm) - b.distanceToUnit(originUnitElm); })
	if (nearestUnit.length == 0) return null;
	else return nearestUnit[0];
}

function FindNearestEnemyUnit(originUnitElm, searchRange) {
	const enemyPlayerID = originUnitElm.playerID == PLAYER_HUMAN ? PLAYER_ENEMY : PLAYER_HUMAN;
	const nearestUnit = PlayerUnits[enemyPlayerID]
	.filter((unitElm) => { return unitElm.isActive && unitElm.distanceToUnit(originUnitElm) < searchRange })
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
	unitElm.Update();
	Units.push(unitElm);
	PlayerUnits[playerID] = Units.filter(u => u.playerID == playerID);
	return unitElm;
}

function DisplayErrorMessage(message) {
	if (MessageHideInterval) window.clearTimeout(MessageHideInterval);
	messageBarElement.innerText = message;
	MessageHideInterval = window.setTimeout(e => messageBarElement.innerText = "", MESSAGE_HIDE_TIMEOUT);
	PlayAudio("ui_error");
}

function PlayAudio(fileName) {
	if (audioInstanceCount > AUDIO_MAX_INSTANCES) return;
	audioInstanceCount++;
	const a = new Audio(`audio/${fileName}.mp3`);
	a.addEventListener('ended', e => audioInstanceCount--);
	a.play();
}

function PlayMusic() {
	new Audio(`audio/${fileName}.mp3`).play();
}

function ConstructBuilding(type, playerID, x, y) {
	const unitData = GetUnitTypeData(type);
	if (PlayerResources[playerID] < unitData.cost) {
		DisplayErrorMessage("Not enough resources. Mine more ore.");
		return false;
	}
	var powered = GetAllPowerGenerators(playerID).some(elm => {return elm.providesPowerAtPoint(x,y)});
	if (!powered) {
		DisplayErrorMessage("Not powered. Place structures in a powered area.");
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

function PingMinimapAtPoint(x,y) {
	const mElm = document.createElement("em");
	mElm.style.left = px(x/MINIMAP_SCALE);
	mElm.style.top = px(y/MINIMAP_SCALE);
	minimapElement.appendChild(mElm);
	window.setTimeout(e => mElm.remove(), MINIMAP_PING_TIMEOUT);
}

function UpdateMinimap() {
	if (Paused) return;
	// minimapElement.innerHTML = "";
	Units.forEach(unitElm => {
		// const mElm = document.createElement("div");

		// mElm.style.left = px(unitElm.centerX/MINIMAP_SCALE);
		// mElm.style.top = px(unitElm.centerY/MINIMAP_SCALE);
		// mElm.dataset.player = unitElm.dataset.player;
		// minimapElement.appendChild(mElm);
	});

//${window.innerWidth/MINIMAP_SCALE}, ${window.innerWidth/MINIMAP_SCALE}

	const scaleX = window.innerWidth/WORLD_SIZE;
	const scaleY = window.innerHeight/WORLD_SIZE;
	const transform = `translate3d(${px(window.scrollX/MINIMAP_SCALE)}, ${px(window.scrollY/MINIMAP_SCALE)}, 0) scale3d(${scaleX},${scaleY},1)`;
	if (minimapViewPortElement.style.transform != transform) minimapViewPortElement.style.transform = transform;
}

function UpdateUnitInfo(force=false) {
	if (Paused) return;
	const selectedUnit = GetSelectedUnit();
	// if (CurrentDisplayUnit != selectedUnit)
	const render = function(...args) {unitInfoElement.innerHTML = args.join("<br>"); }

	if (CurrentDisplayUnit && !CurrentDisplayUnit.isActive) {
		CurrentDisplayUnit = null;
		unitInfoElement.innerHTML = "";
		trainButtonsElement.innerHTML = "";
		unitPortrait.src = "";
		return;
	}

	var refreshInfo = (force || (selectedUnit != null && CurrentDisplayUnit != selectedUnit));
	var refreshButtons = (CurrentDisplayUnit != selectedUnit);

	if (!selectedUnit && CurrentDisplayUnit != null) {
		CurrentDisplayUnit = null;
		unitInfoElement.innerHTML = "";
		trainButtonsElement.innerHTML = "";
	}
	
	if (CurrentDisplayUnit != selectedUnit) {
		CurrentDisplayUnit = selectedUnit;
	}

	if (refreshInfo && selectedUnit) {
		unitPortrait.src = selectedUnit.portraitImage;
		unitInfoElement.innerHTML = "";
		if (CurrentDisplayUnit.isHarvester) render(CurrentDisplayUnit, `${CurrentDisplayUnit.hp} hp`, CurrentDisplayUnit.order, `Cargo: ${CurrentDisplayUnit.resourceCarryAmount} ore`);
		else if (CurrentDisplayUnit.isAttackingUnit) render(CurrentDisplayUnit, `${CurrentDisplayUnit.hp} hp`, `Damage: ${CurrentDisplayUnit.attackDamage}`, CurrentDisplayUnit.order);
		else if (CurrentDisplayUnit.isResourceNode) render(CurrentDisplayUnit, `Resources: ${CurrentDisplayUnit.remainingResources}`);
		else if (!CurrentDisplayUnit.isMobile) render(CurrentDisplayUnit, `${CurrentDisplayUnit.hp} hp`, CurrentDisplayUnit.order);
		else render(CurrentDisplayUnit, CurrentDisplayUnit.order, CurrentDisplayUnit.targetUnit);
	}

	if (refreshButtons) {
		trainButtonsElement.innerHTML = "";
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

function CalculateSpawnAmount(amount) {
	if (Math.random() < Difficulty/10) {
		amount += Math.floor(Math.random()*Difficulty);
	}
	return amount;
}

function TriggerNewGameEvent(id = null) {
	const eventKeys = Object.keys(GameEvent);
	// TODO randomize with weights
	if (!id) id = eventKeys[parseInt(Math.random() * eventKeys.length - 1)];
	const newEvent =  GetGameEvent(id);
	GameEvents.push(newEvent);
	// TODO ping mini map

	const eventElement = document.createElement("span");
	eventElement.innerText = newEvent.message;
	var eventX = Number.NaN;
	var eventY = Number.NaN;
	var units;
	switch (newEvent.id) {
		case GameEvent.PirateInvasion:
			eventX = GetRandomWorldPointAtEdge();
			eventY = GetRandomWorldPointAtEdge();
			CreateUnitsInArea(CalculateSpawnAmount(2), Type.PirateRaider, PLAYER_ENEMY, eventX, eventY).forEach(unitElm => unitElm.orderAttackMoveToPoint(WORLD_SIZE/2,WORLD_SIZE/2))
			// if (Difficulty > 10) CreateUnitsInArea(CalculateSpawnAmount(1), Type.PirateMarauder, PLAYER_ENEMY, eventX, eventY).forEach(unitElm => unitElm.orderAttackMoveToPoint(WORLD_SIZE/2, WORLD_SIZE/2))
		break;
		case GameEvent.AlienInvasion:
			eventX = GetRandomWorldPoint();
			eventY = GetRandomWorldPoint();
			CreateUnitsInArea(CalculateSpawnAmount(3), Type.AlienAffliction, PLAYER_ENEMY, eventX, eventY).forEach(unitElm => unitElm.orderToPatrolInArea())
			// CreateUnitsInArea(CalculateSpawnAmount(1), Type.AlienGorger, PLAYER_ENEMY, eventX, eventY).forEach(unitElm => unitElm.orderToPatrolInArea())
		break;
		case GameEvent.RivalMiners:
			eventX = GetRandomWorldPointNearEdge();
			eventY = GetRandomWorldPointNearEdge();
			CreateUnit(Type.ResourceDepot, PLAYER_ENEMY, eventX, eventY);
			units = CreateUnitsInArea(CalculateSpawnAmount(3), Type.Harvester, PLAYER_ENEMY, eventX, eventY);
			units.forEach(unitElm => unitElm.harvestNearbyResources())
		break;
		case GameEvent.Reinforcements:
			eventX = WORLD_SIZE/2;
			eventY = WORLD_SIZE/2;
			CreateUnit(Type.Interceptor, PLAYER_HUMAN, eventX, eventY);
		break;
		case GameEvent.ArtefactDiscovery:
			eventX = GetRandomWorldPoint();
			eventY = GetRandomWorldPoint();
			CreateUnit(Type.Artefact, PLAYER_NEUTRAL, eventX, eventY);
		break;
		case GameEvent.DerelictStation:
			eventX = GetRandomWorldPoint();
			eventY = GetRandomWorldPoint();
			CreateUnit(Type.DerelictStation, PLAYER_NEUTRAL, eventX, eventY);
		break;
	}

	if (!Number.isNaN(eventX) && !Number.isNaN(eventY)) {
		PingMinimapAtPoint(eventX, eventY);
	}

	Difficulty++;

	eventInfoElement.insertBefore(eventElement, eventInfoElement.firstChild);
	while (eventInfoElement.childElementCount > 3) {
		eventInfoElement.childNodes[3].remove();
	}
	
}

function UpdateUI() {
	if (Paused) return;
	statusBarElement.innerText = `${PlayerResources[PLAYER_HUMAN]}`;
}

function SelectUnitsInRectangle(x, y, w, h, add=false) {
	if (!add) DeselectAllUnits();
	const units = GetAllPlayerUnits(PLAYER_HUMAN)
	.filter(unitElm => (!unitElm.isSingleSelect && unitElm.centerX >= x && unitElm.centerX <= x+w && unitElm.centerY >= y && unitElm.centerY <= y+h));
	units.forEach(unitElm => unitElm.select());
	if (units.length > 0) units[0].playWhatAudio();

}

function Pause() {
	Paused = true;
	MusicAudio.pause();
}

function Resume() {
	Paused = false;
	MusicAudio.play();
}

function Tick(time) {
	var timeInSeconds = time * 0.001;
	var deltaTime = (time - previousTime) / 10;
	previousTime = time;

	document.body.classList.toggle("paused", Paused);
	mainMenuResumeButtonElement.classList.toggle("visible", GameStarted);
	if (!Paused) {
		if (PlayerResources[PLAYER_HUMAN] >= RESOURCE_GOAL) {
			Pause();
			victorySplashElement.classList.add("visible");
		}
		if (GetAllPlayerUnits(PLAYER_HUMAN).length == 0) LoseGame();
		Units.forEach(unitElm => unitElm.Update(deltaTime));

		tooltipElement.classList.toggle("visible", TooltipDisplaying);
		if (TooltipDisplaying) {
			tooltipElement.style.left = px(mouseClientX);
			tooltipElement.style.top = px(mouseClientY);
		}

		selectionRectangleElement.classList.toggle("visible", SelectionRectangleDisplaying);
		if (SelectionRectangleDisplaying) {
			selectionRectangleElement.style.top = px(SelectionRectangleTop);
			selectionRectangleElement.style.left = px(SelectionRectangleLeft);
			selectionRectangleElement.style.width = px(SelectionRectangleWidth);
			selectionRectangleElement.style.height = px(SelectionRectangleHeight);
		}

		document.body.classList.toggle("showPowerRange", CurrentBuildingPlaceType);
		buildingPlacementGhostElement.classList.toggle("visible", CurrentBuildingPlaceType);
		if (CurrentBuildingPlaceType) {
			CurrentBuildingPlacemenValid = GetAllPowerGenerators(PLAYER_HUMAN).some(elm => {return elm.providesPowerAtPoint(mousePlaceX,mousePlaceY)});
			buildingPlacementGhostElement.classList.toggle("valid", CurrentBuildingPlacemenValid);
			buildingPlacementGhostElement.style.left = px(mousePlaceX);
			buildingPlacementGhostElement.style.top = px(mousePlaceY);
		}


		if ((GetSelectedUnit() != null && CurrentDisplayUnit != GetSelectedUnit() || (CurrentDisplayUnit && !CurrentDisplayUnit.isActive))) {
			UpdateUnitInfo();
		}


		var scrollX = 0;
		var scrollY = 0;
		const mouseMove = true;
		if (KeyDDown || (mouseMove && mouseClientX >= window.innerWidth - TILE)) scrollX += TILE/2;
		if (KeyADown || (mouseMove && mouseClientX <= 0)) scrollX -= TILE/2;
		if (KeySDown || (mouseMove && mouseClientY >= window.innerHeight - TILE)) scrollY += TILE/2;
		if (KeyWDown || (mouseMove && mouseClientY <= 0)) scrollY -= TILE/2;
		if (scrollX != 0 || scrollY != 0) window.scrollBy(scrollX*deltaTime, scrollY*deltaTime);

		while(EventTimer >= GAME_EVENT_THRESHOLD) {
			EventTimer -= GAME_EVENT_THRESHOLD;
			TriggerNewGameEvent();
		}
	};

	window.requestAnimationFrame(Tick);
}

document.addEventListener("DOMContentLoaded", evt => {

	document.addEventListener("click", evt => {
		if (!evt.target) return;

		if (evt.target == splashElement) EnterMainMenu();
		else if (evt.target == mainMenuButtonElement) Pause();
		else if (evt.target == victorySplashElement) EnterMainMenu();
		else if (evt.target == mainMenuResumeButtonElement) Resume();
		else if (evt.target == mainMenuNewGameButtonElement) StartNewGame();

		if (Paused) return;

		if (evt.target.tagName.toLowerCase() == "button") {
			if (evt.target.dataset.constructType) CurrentBuildingPlaceType = evt.target.dataset.constructType;
			if (evt.target.dataset.trainType && CurrentDisplayUnit) {
				CurrentDisplayUnit.trainUnit(evt.target.dataset.trainType);
			}
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
			evt.target.playWhatAudio();
		} else if (evt.target == minimapElement) {
			window.scrollTo(evt.offsetX * MINIMAP_SCALE - window.innerWidth/2, evt.offsetY * MINIMAP_SCALE - window.innerHeight/2);
			UpdateMinimap();
		}
	});

	document.addEventListener("mousedown", evt => {
		mouseDown = evt.button == 0;
		if (evt.button == 0 && (evt.target == worldElement || evt.target.tagName.toLowerCase() == UNIT_SELECTOR)) {
			SelectionRectangleDisplaying = true;
			SelectionRectangleTop = evt.pageY;
			SelectionRectangleLeft = evt.pageX;
			SelectionRectangleHeight = 0;
			SelectionRectangleWidth = 0;
		}
	});
	document.addEventListener("mouseup", evt => {
		mouseDown = false;
		if (SelectionRectangleDisplaying) {
			SelectUnitsInRectangle(SelectionRectangleLeft, SelectionRectangleTop, SelectionRectangleWidth, SelectionRectangleHeight, evt.shiftKey);
			SelectionRectangleDisplaying = false;
			SelectionRectangleTop = 0;
			SelectionRectangleLeft = 0;
			SelectionRectangleHeight = 0;
			SelectionRectangleWidth = 0;
		}
	});

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
		if (SelectionRectangleDisplaying) {
			SelectionRectangleWidth = evt.pageX - SelectionRectangleLeft;
			SelectionRectangleHeight = evt.pageY - SelectionRectangleTop;
		}
		mousePlaceX = Math.floor(mouseX/TILE)*TILE;
		mousePlaceY = Math.floor(mouseY/TILE)*TILE;
		mouseClientX = evt.clientX;
		mouseClientY = evt.clientY;
		if (mouseDown && evt.target == minimapElement) {
			window.scrollTo(evt.offsetX * MINIMAP_SCALE - window.innerWidth/2, evt.offsetY * MINIMAP_SCALE - window.innerHeight/2);
			UpdateMinimap();
		}
	})

	document.addEventListener("keydown", evt => {
		if (evt.key == "w") KeyWDown = true;
		if (evt.key == "a") KeyADown = true;
		if (evt.key == "s") KeySDown = true;
		if (evt.key == "d") KeyDDown = true;
	});

	document.addEventListener("keyup", evt => {
		if (evt.key == "w") KeyWDown = false;
		if (evt.key == "a") KeyADown = false;
		if (evt.key == "s") KeySDown = false;
		if (evt.key == "d") KeyDDown = false;
		if (evt.key == "s" && GetSelectedUnit()) GetSelectedUnit().stop();

		Object.keys(UnitTypeData).forEach(type => {
			if (evt.key.toLowerCase() == GetUnitTypeData(type).hotkey) {
				const data = GetUnitTypeData(type);
				if (data.isBuilding) {
					CurrentBuildingPlaceType = type;
				} else {
					if (DEBUG_MODE && evt.shiftKey) {
						CreateUnit(type, evt.ctrlKey ? PLAYER_ENEMY : PLAYER_HUMAN, mouseX, mouseY)
					} else {
						const selectedUnit = GetSelectedUnit();
						if (selectedUnit) selectedUnit.trainUnit(UnitTypeData[type].type);
					}
				}
			}
		});
	});

	document.addEventListener("contextmenu", evt => {
		evt.preventDefault();
		if (CurrentBuildingPlaceType) CurrentBuildingPlaceType = null;
		const targetUnitElm = evt.target;
		SelectedUnits.forEach(unitElm => {
			if (unitElm.playerID == PLAYER_HUMAN && unitElm.isMobile) {
				if (evt.target == minimapElement) {
					if (evt.ctrlKey && unitElm.isAttackingUnit) unitElm.orderAttackMoveToPoint(evt.offsetX * MINIMAP_SCALE, evt.offsetY * MINIMAP_SCALE);
 					else unitElm.orderMoveToPoint(evt.offsetX * MINIMAP_SCALE, evt.offsetY * MINIMAP_SCALE);
				} else {
					if (!evt.target || !UnitElement.isElementUnit(evt.target)) {
						if (evt.ctrlKey && unitElm.isAttackingUnit) unitElm.orderAttackMoveToPoint(evt.pageX, evt.pageY);
	 					else unitElm.orderMoveToPoint(evt.pageX, evt.pageY);
					}
					else unitElm.orderInteractWithUnit(evt.target);

				}
			}
		})
		if (SelectedUnits.length > 0 && SelectedUnits[0].playerID == PLAYER_HUMAN && SelectedUnits[0].isMobile) SelectedUnits[0].playAckAudio();
		UpdateUnitInfo();
	});

	document.addEventListener("animationend", evt => {
		if (evt.target && evt.target.tagName.toLowerCase() == SPRITE_SELECTOR) evt.target.remove()
	});

	window.addEventListener("beforeunload", evt => {
		evt.preventDefault();
		return event.returnValue = "Are you sure you want to exit the current game?";
	});

	// window.addEventListener("blur", evt => { Pause(); });
	// window.addEventListener("focus", evt => { Resume(); });

	SetupGame();
});