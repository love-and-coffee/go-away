let currentGameState = {
	tutorialShown: false,
	firstPlayAt: Date.now(),
	gameFinishedAt: null,
	gameEnded: false,
	worldStartedAt: Date.now(),
	isPremium: false,
	hasDoubleSpeedUnlocked: false,
	highestStageUnclocked: 0,
	soundOn: null,
	world: 0,
	gameSpeed: 1,
};

// #region - Helpers
String.prototype.replaceAt = function (index, char) {
	return this.substr(0, index) + char + this.substr(index + char.length);
};

const setStyle = (element, property, value) => {
	element.style[property] = value;
};

const addEventListener = (e, t, f) => {
	e.addEventListener(t, f);
};

const removeEventListener = (e, t, f) => {
	e.removeEventListener(t, f);
};

const querySelector = (selector, target = document) => {
	return target.querySelector(selector);
};

const querySelectorAll = (selector, target = document) => {
	return target.querySelectorAll(selector);
};

const replaceContent = (target, content) => {
	target.innerHTML = content;
};

const replaceText = (target, content) => {
	target.textContent = content;
};

const addContent = (target, content) => {
	target.insertAdjacentHTML("beforeend", content);
};

const randomIntFromInterval = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1) + min);
};

const getDuration = (d1, d2) => {
	let durationInSeconds = Math.floor((d2 - d1) / 1000);

	const hours = Math.floor(durationInSeconds / 60 / 60);
	durationInSeconds -= hours * 60 * 60;

	const minutes = Math.floor(durationInSeconds / 60);
	durationInSeconds -= minutes * 60;

	if (hours > 0) {
		return hours + "h " + minutes + "m " + durationInSeconds + "s";
	} else {
		return minutes + "m " + durationInSeconds + "s";
	}
};

const hexToRgbA = (hex, alpha = 1) => {
	var c;
	if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
		c = hex.substring(1).split("");
		if (c.length == 3) {
			c = [c[0], c[0], c[1], c[1], c[2], c[2]];
		}
		c = "0x" + c.join("");
		return "rgba(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") + "," + alpha + ")";
	}
	throw new Error("Bad Hex");
};

const detachElement = (targetElement) => {
	const { x, y, width, height } = targetElement.getBoundingClientRect();

	rootElement.appendChild(targetElement);

	targetElement.style.position = "fixed";
	targetElement.style.left = x + "px";
	targetElement.style.top = y + "px";
	targetElement.style.width = width + "px";
	targetElement.style.height = height + "px";
	targetElement.style.zIndex = "5";
};
// #endregion

// #region - Game Helpers
const checkDangerStatus = (card) => {
	if (currentGameState.shield > 0) {
		card.cardElement.classList.toggle("will-take-damage", false);
		card.cardElement.classList.toggle("will-die", false);
	} else if (currentGameState.health > card.damage) {
		card.cardElement.classList.toggle("will-take-damage", true);
		card.cardElement.classList.toggle("will-die", false);
	} else {
		card.cardElement.classList.toggle("will-take-damage", false);
		card.cardElement.classList.toggle("will-die", true);
	}
};

const checkExpireStatus = (card) => {
	if (card.turnsBeforeCardExpires <= 1) {
		card.cardElement.classList.toggle("will-expire-in-two-turns", false);
		card.cardElement.classList.toggle("will-expire-next-turn", true);
	} else if (card.turnsBeforeCardExpires <= 2) {
		card.cardElement.classList.toggle("will-expire-in-two-turns", true);
		card.cardElement.classList.toggle("will-expire-next-turn", false);
	} else {
		card.cardElement.classList.toggle("will-expire-in-two-turns", false);
		card.cardElement.classList.toggle("will-expire-next-turn", false);
	}
};

let popupId = 0;

const removePopupContainer = (container, speed, delay) => {
	tween(container, {
		delay: delay * speed,
		duration: 500 * speed,
		easing: ease.sineOut,
		from: {
			opacity: 1,
		},
		to: {
			opacity: 0,
		},
		onend(target) {
			container.remove();
		},
	});
};

const showPopup = (
	content,
	buttons,
	onClose = null,
	full = false,
	additonalClass = "",
	closeDelay = 0
) => {
	popupId += 1;

	let popupClass = "popup";
	if (full) {
		popupClass += " full";
	}

	popupClass += " " + additonalClass;

	let popup = `<div id="popup-${popupId}" class="popup-container"><div class="${popupClass}"><div class="popup-content">${content}</div><div class="popup-buttons">`;

	buttons.forEach((button, buttonIndex) => {
		let buttonClass = "";

		if (button.locked) {
			buttonClass = "locked";
		}
		popup += `<button id="popup-${popupId}-button-${buttonIndex}" class="popup-button ${buttonClass}">${button.content}</button>`;
	});

	popup += `</div></div></div>`;

	addContent(rootElement, popup);

	updateLockIcons();

	const popupContainerElement = querySelector(`#popup-${popupId}`);

	const popupElement = querySelector(".popup", popupContainerElement);
	popupElement.addEventListener("click", (e) => {
		e.stopPropagation();
	});

	let speed = 1;

	let easing = ease.bounceOut;

	let from = {
		scaleX: 0,
		scaleY: 0,
	};
	let to = {
		scaleX: 1,
		scaleY: 1,
	};

	if (full) {
		speed = 1;

		easing = ease.bounceOut;

		from = {
			y: screenHeight,
		};
		to = {
			y: 0,
		};
	}

	querySelectorAll(`#popup-${popupId} .popup-button`).forEach((button, index) => {
		button.addEventListener("click", () => {
			if (button.classList.contains("locked")) {
				return;
			}
			if (buttons[index].action === "close") {
				if (typeof onClose === "function") {
					onClose();
				}
				removePopupContainer(popupContainerElement, speed, closeDelay);
			} else {
				buttons[index].action();
				removePopupContainer(popupContainerElement, speed, closeDelay);
			}
		});
	});

	tween(popupContainerElement, {
		delay: 0,
		duration: 500 * speed,
		easing: ease.sineIn,
		from: {
			opacity: 0,
		},
		to: {
			opacity: 1,
		},
		onend(target) {
			tween(popupElement, {
				delay: 250 * speed,
				duration: 750 * speed,
				easing: easing,
				from: from,
				to: to,
				onend(target) {
					popupContainerElement.addEventListener("click", () => {
						if (typeof onClose === "function") {
							onClose();
						}

						removePopupContainer(popupContainerElement, speed, closeDelay);
					});
				},
			});
		},
	});
};

let gameSpeedButtonElement;

const displayActiveGameSpeed = () => {
	const gameSpeedElements = querySelectorAll("b", gameSpeedButtonElement);

	gameSpeedElements.forEach((gameSpeedElement, gameSpeedIndex) => {
		if (gameSpeedIndex === 0 && currentGameState.gameSpeed === 1) {
			gameSpeedElement.classList.toggle("active", true);
		} else if (gameSpeedIndex === 1 && currentGameState.gameSpeed === 2) {
			gameSpeedElement.classList.toggle("active", true);
		} else if (gameSpeedIndex === 2 && currentGameState.gameSpeed === 4) {
			gameSpeedElement.classList.toggle("active", true);
		} else {
			gameSpeedElement.classList.toggle("active", false);
		}
	});
};

const changeGameSpeed = () => {
	if (
		currentGameState.gameSpeed === 1 &&
		(currentGameState.hasDoubleSpeedUnlocked || currentGameState.isPremium)
	) {
		currentGameState.gameSpeed = 2;
	} else if (currentGameState.gameSpeed === 2 && currentGameState.isPremium) {
		currentGameState.gameSpeed = 4;
	} else {
		currentGameState.gameSpeed = 1;
	}

	saveGame(currentGameState);

	displayActiveGameSpeed();
};

const initGameSpeed = () => {
	addContent(
		gameControlElement,
		`<button id="game-speed"><b>1x</b><b>2x</b><b>4x <b class="vip">V.I.P.</b></b></button>`
	);
	gameSpeedButtonElement = querySelector("#game-speed", gameControlElement);
	addEventListener(gameSpeedButtonElement, "click", changeGameSpeed);
	displayActiveGameSpeed();
	updateGameSpeedLock();
};

const updateGameSpeedLock = () => {
	const speed2locked =
		currentGameState.hasDoubleSpeedUnlocked === false && currentGameState.isPremium === false;
	const speed4locked = currentGameState.isPremium === false;

	querySelectorAll("#game-speed > b", gameControlElement).forEach((speedButton, speedIndex) => {
		if (speedIndex == 1) {
			speedButton.classList.toggle("locked", speed2locked);
		}
		if (speedIndex == 2) {
			speedButton.classList.toggle("locked", speed4locked);
		}
	});

	if (currentGameState.gameSpeed == 4 && speed4locked) {
		changeGameSpeed();
	}

	if (currentGameState.gameSpeed == 2 && speed2locked) {
		changeGameSpeed();
	}

	updateLockIcons();
};

const initSocial = () => {
	addContent(
		gameControlElement,
		`<a target="_blank" href="https://discord.gg/99ZvC6W3r4">${getSVG(svgs.DISCORD)}</a>`
	);
	addContent(
		gameControlElement,
		`<a class="coffee" target="_blank" href="https://ko-fi.com/martintale?ref=go-away">${getSVG(
			svgs.COFFEE
		)}</a>`
	);
};
// #endregion

// #region - Globals
const screenWidth = document.documentElement.clientWidth;
const screenHeight = document.documentElement.clientHeight;

addContent(
	document.body,
	`<div id="root"><div id="background"></div><div id="game-controls"></div><div id="top"><div id="year"></div></div><div id="earth"><div id="stats"><div id="health"></div><div id="shield"></div><div id="damage"></div></div></div><div id="cards"><div class="card-slot"></div><div class="card-slot"></div><div class="card-slot"></div><div class="card-slot"></div><div class="card-slot"></div><div class="card-slot"></div></div></div>`
);

const rootElement = querySelector("#root");
const gameControlElement = querySelector("#game-controls", rootElement);
const backgroundElement = querySelector("#background");
const yearElement = querySelector("#year");
let yearAmountElement;
let yearMaxElement;
let yearSvgElement;
const earthElement = querySelector("#earth");
const healthElement = querySelector("#health");
let healthAmountElement;
let healthSvgElement;
const shieldElement = querySelector("#shield");
let shieldAmountElement;
let shieldSvgElement;
const damageElement = querySelector("#damage");
let damageAmountElement;
let damageSvgElement;
const cardSlotElements = querySelectorAll(".card-slot");
// #endregion

// #region - Animations
const animationTarget = {
	PLAY_CARD: 200,
	CARD_TURN: 300,
	DRAW_CARD: 400,
	YEAR: 1000,
	END_GAME: 2000,
};

const animationQueue = [];

const addAnimationToQueue = (order, animation, delay = 1000) => {
	animationQueue.push({
		order: order,
		animation: animation,
		delay: delay,
	});
};

// 500 ms
const animateNumber = (targetElement, from, to, colorClass = null, delay = 0, onEnd = null) => {
	const amount = to - from;

	tween(targetElement, {
		delay: delay / currentGameState.gameSpeed,
		duration: 500 / currentGameState.gameSpeed,
		easing: ease.quadInOut,
		from: {
			value: 0,
		},
		to: {
			value: amount,
		},
		onstart(target) {
			if (colorClass != null) {
				targetElement.classList.toggle(colorClass, true);
			}
		},
		onprogress(target, progress) {
			replaceText(target, Math.floor(from + amount * progress).toLocaleString());
		},
		onend(target) {
			replaceText(target, to.toLocaleString());
			if (colorClass != null) {
				targetElement.classList.toggle(colorClass, false);
			}
			if (typeof onEnd === "function") {
				onEnd();
			}
		},
	});
};

// 700 ms
const baunceElement = (targetElement, height, direction = "top", delay = 0) => {
	let fromStart = {
		y: 0,
	};
	let toStart = {
		y: -height,
	};
	let fromEnd = {
		y: -height,
	};
	let toEnd = {
		y: 0,
	};

	if (direction == "right") {
		fromStart = {
			x: 0,
		};
		toStart = {
			x: height,
		};
		fromEnd = {
			x: height,
		};
		toEnd = {
			x: 0,
		};
	}

	if (direction == "down") {
		toStart = {
			y: height,
		};
		fromEnd = {
			y: height,
		};
	}

	tween(targetElement, {
		delay: delay / currentGameState.gameSpeed,
		duration: 100 / currentGameState.gameSpeed,
		easing: ease.quartOut,
		from: fromStart,
		to: toStart,
		onend(target) {
			tween(target, {
				delay: 0,
				duration: 600 / currentGameState.gameSpeed,
				easing: ease.bounceOut,
				from: fromEnd,
				to: toEnd,
			});
		},
	});
};

// 400+ ms
const glowElementInAndOut = (
	targetElement,
	blur,
	color,
	delayBeforeGlowOut = 100,
	delayBeforeGlowIn = 0
) => {
	targetElement.dataset.blur = blur;
	targetElement.dataset.color = color;

	tween(targetElement, {
		delay: delayBeforeGlowIn / currentGameState.gameSpeed,
		duration: 200 / currentGameState.gameSpeed,
		easing: ease.quartOut,
		from: {
			glow: 0,
		},
		to: {
			glow: 1,
		},
		onend(target) {
			tween(target, {
				delay: delayBeforeGlowOut / currentGameState.gameSpeed,
				duration: 200 / currentGameState.gameSpeed,
				easing: ease.quadIn,
				from: {
					glow: 1,
				},
				to: {
					glow: 0,
				},
			});
		},
	});
};

// 400+ ms
const scaleUpAndDown = (targetElement, duration = 600) => {
	tween(targetElement, {
		delay: 0,
		duration: 200 / currentGameState.gameSpeed,
		easing: ease.quadIn,
		from: {
			scaleX: 1,
			scaleY: 1,
		},
		to: {
			scaleX: 1.1,
			scaleY: 1.1,
		},
		onend(target) {
			tween(target, {
				delay: (duration - 400) / currentGameState.gameSpeed,
				duration: 200 / currentGameState.gameSpeed,
				easing: ease.quadIn,
				from: {
					scaleX: 1.1,
					scaleY: 1.1,
				},
				to: {
					scaleX: 1,
					scaleY: 1,
				},
			});
		},
	});
};

// 500 ms
const zoomUpAndFadeOut = (targetElement, delay = 0, onEnd = null) => {
	tween(targetElement, {
		delay: delay / currentGameState.gameSpeed,
		duration: 500 / currentGameState.gameSpeed,
		easing: ease.quintOut,
		from: {
			y: 0,
			scaleX: 1,
			scaleY: 1,
		},
		to: {
			y: -75,
			scaleX: 1.1,
			scaleY: 1.1,
		},
		onend(target) {
			if (typeof onEnd === "function") {
				onEnd();
			}
		},
	});
	tween(targetElement, {
		delay: (200 + delay) / currentGameState.gameSpeed,
		duration: 250 / currentGameState.gameSpeed,
		easing: ease.linear,
		from: {
			opacity: 1,
		},
		to: {
			opacity: 0,
		},
	});
};

// 1,650 ms
const playAndFadeOut = (targetElement, directionElement, onEnd) => {
	const from = targetElement.getBoundingClientRect();
	const to = directionElement.getBoundingClientRect();

	const destinationX = to.x + to.width * 0.5 - (from.x + from.width * 0.5);
	const destinationY = to.y + to.height * 0.5 - (from.y + from.height * 0.5);

	tween(targetElement, {
		delay: 0,
		duration: 100 / currentGameState.gameSpeed,
		easing: ease.sineInOut,
		from: {
			scaleX: 1,
			scaleY: 1,
			perspective: 200,
			rotationX: 0,
		},
		to: {
			scaleX: 1.2,
			scaleY: 1.2,
			perspective: 200,
			rotationX: 80,
		},
		onend(target) {
			tween(targetElement, {
				delay: 0,
				duration: 100 / currentGameState.gameSpeed,
				easing: ease.sineInOut,
				from: {
					scaleX: 1.2,
					scaleY: 1.2,
					perspective: 200,
					rotationX: 80,
				},
				to: {
					scaleX: 1.5,
					scaleY: 1.5,
					perspective: 200,
					rotationX: -10,
				},
				onend(target) {
					tween(targetElement, {
						delay: 200 / currentGameState.gameSpeed,
						duration: 250 / currentGameState.gameSpeed,
						easing: ease.sineInOut,
						from: {
							x: 0,
							y: 0,
							scaleX: 1.5,
							scaleY: 1.5,
							perspective: 200,
							rotationX: -10,
						},
						to: {
							x: destinationX,
							y: destinationY,
							scaleX: 0.25,
							scaleY: 0.25,
							perspective: 200,
							rotationX: 0,
						},
						onend(target) {
							tween(targetElement, {
								delay: 500 / currentGameState.gameSpeed,
								duration: 500 / currentGameState.gameSpeed,
								easing: ease.quintOut,
								from: {
									opacity: 1,
								},
								to: {
									opacity: 0,
								},
								onend(target) {
									if (typeof onEnd === "function") {
										onEnd();
									}
								},
							});
						},
					});
				},
			});
		},
	});
};

// 1,500 ms
const zoomBounceAndFadeIn = (targetElement, delay = 0) => {
	tween(targetElement, {
		delay: delay / currentGameState.gameSpeed,
		duration: 700 / currentGameState.gameSpeed,
		easing: ease.bounceOut,
		from: {
			scaleX: 0,
			scaleY: 0,
		},
		to: {
			scaleX: 1,
			scaleY: 1,
		},
	});
	tween(targetElement, {
		delay: delay / currentGameState.gameSpeed,
		duration: 300 / currentGameState.gameSpeed,
		easing: ease.linear,
		from: {
			opacity: 0,
		},
		to: {
			opacity: 1,
		},
	});
};
// #endregion

// #region - One Time Use
const addStarBackground = () => {
	for (let i = 0; i < 50; i += 1) {
		addContent(backgroundElement, getSVG(svgs.STAR, "#ffffff"));
	}
	querySelectorAll("#background svg").forEach((star) => {
		star.style.left = `${randomIntFromInterval(-5, Math.min(495, screenWidth - 5))}px`;
		star.style.top = `${randomIntFromInterval(-5, Math.min(695, screenHeight - 5))}px`;
		star.style.transform = `rotate(${randomIntFromInterval(0, 360)}deg) scale(${
			randomIntFromInterval(50, 200) * 0.01
		})`;
		star.style.opacity = randomIntFromInterval(10, 50) * 0.01;
	});
};

const initElements = () => {
	addStarBackground();

	addContent(yearElement, getSVG(svgs.EARTH));
	addContent(yearElement, `<b class="current-year"></b>&nbsp;<b class="max-year"></b>`);
	yearAmountElement = querySelector(".current-year", yearElement);
	yearMaxElement = querySelector(".max-year", yearElement);
	yearSvgElement = querySelector("svg", yearElement);

	addContent(healthElement, getSVG(svgs.HEART));
	addContent(healthElement, "<b></b>");
	healthAmountElement = querySelector("b", healthElement);
	healthSvgElement = querySelector("svg", healthElement);

	addContent(shieldElement, getSVG(svgs.SHIELD));
	addContent(shieldElement, "<b></b>");
	shieldAmountElement = querySelector("b", shieldElement);
	shieldSvgElement = querySelector("svg", shieldElement);

	addContent(damageElement, getSVG(svgs.SWORD));
	addContent(damageElement, "<b></b>");
	damageAmountElement = querySelector("b", damageElement);
	damageSvgElement = querySelector("svg", damageElement);

	cardSlotElements.forEach((cardSlot, cardIndex) => {
		cardSlot.addEventListener("click", () => playCard(cardIndex));
	});
};

const setupWorld = (world) => {
	if (currentGameState.icon == null) {
		Object.assign(currentGameState, worlds[currentGameState.world]);
	}
	earthElement.classList.toggle("moon", world === 0);
	earthElement.classList.toggle("mars", world === 2);
	earthElement.classList.toggle("death-star", world === 3);

	querySelectorAll("#earth > svg", rootElement).forEach((svg) => svg.remove());
	addContent(earthElement, getSVG(worlds[world].icon));

	replaceText(yearAmountElement, currentGameState.year);
	replaceText(yearMaxElement, ` / ${currentGameState.maxYear}`);
	replaceText(healthAmountElement, currentGameState.health);
	replaceText(shieldAmountElement, currentGameState.shield);
	replaceText(damageAmountElement, currentGameState.damage);

	cardSlotElements.forEach((cardContainer) => {
		cardContainer.style.display = "none";
		cardContainer.innerHTML = "";
	});
	currentGameState.cards.forEach((card, index) => {
		cardSlotElements[index].style.display = "flex";
	});

	currentGameState.cards.forEach((card, index) => {
		addCard(index);
	});

	playAnimations();
};
// #endregion

// #region - Tweens
class Tween {
	constructor(target, handler, settings) {
		this.target = target;
		this.handler = handler;

		this.start = settings.start;
		this.end = settings.end;

		this.easing = settings.easing;

		this.from = settings.from;
		this.to = settings.to;
		this.keys = [];

		this.onstart = settings.onstart;
		this.onprogress = settings.onprogress;
		this.onend = settings.onend;

		this.running = false;

		this.store = target.__liike || (target.__liike = {});
	}

	init() {
		for (const key in this.to) {
			if (!(key in this.from)) {
				this.from[key] = this.store[key] || 0;
			}
			this.keys.push(key);
		}

		for (const key in this.from) {
			if (!(key in this.to)) {
				this.to[key] = this.store[key] || 0;
				this.keys.push(key);
			}
		}
	}

	tick(t) {
		const e = this.easing(t);

		for (let i = 0; i < this.keys.length; i++) {
			const key = this.keys[i];

			this.store[key] = this.from[key] + (this.to[key] - this.from[key]) * e;
		}

		this.handler(this.target, this.store);
	}
}

const easeInBy = (power) => (t) => Math.pow(t, power);
const easeOutBy = (power) => (t) => 1 - Math.abs(Math.pow(t - 1, power));
const easeInOutBy = (power) => (t) =>
	t < 0.5 ? easeInBy(power)(t * 2) / 2 : easeOutBy(power)(t * 2 - 1) / 2 + 0.5;

const ease = {
	linear: (t) => t,
	quadIn: easeInBy(2),
	quadOut: easeOutBy(2),
	quadInOut: easeInOutBy(2),
	cubicIn: easeInBy(3),
	cubicOut: easeOutBy(3),
	cubicInOut: easeInOutBy(3),
	quartIn: easeInBy(4),
	quartOut: easeOutBy(4),
	quartInOut: easeInOutBy(4),
	quintIn: easeInBy(5),
	quintOut: easeOutBy(5),
	quintInOut: easeInOutBy(5),
	sineIn: (t) => 1 + Math.sin((Math.PI / 2) * t - Math.PI / 2),
	sineOut: (t) => Math.sin((Math.PI / 2) * t),
	sineInOut: (t) => (1 + Math.sin(Math.PI * t - Math.PI / 2)) / 2,
	bounceOut: (t) => {
		const s = 7.5625;
		const p = 2.75;

		if (t < 1 / p) {
			return s * t * t;
		}
		if (t < 2 / p) {
			t -= 1.5 / p;
			return s * t * t + 0.75;
		}
		if (t < 2.5 / p) {
			t -= 2.25 / p;
			return s * t * t + 0.9375;
		}
		t -= 2.625 / p;
		return s * t * t + 0.984375;
	},
	bounceIn: (t) => 1 - ease.bounceOut(1 - t),
	bounceInOut: (t) =>
		t < 0.5 ? ease.bounceIn(t * 2) * 0.5 : ease.bounceOut(t * 2 - 1) * 0.5 + 0.5,
};

const tweens = [];
const jobs = [];
const nullFunc = () => {};

let ticking = 0;

const tick = (now) => {
	while (jobs.length) {
		const job = jobs.shift();

		job(now);
	}

	for (let i = 0; i < tweens.length; i++) {
		const tween = tweens[i];

		if (now < tween.start) {
			// not yet started
			continue;
		}

		if (!tween.running) {
			tween.running = true;
			tween.init();
			tween.onstart(tween.target);
		}

		const t = (now - tween.start) / (tween.end - tween.start);

		tween.tick(t < 1 ? t : 1);
		tween.onprogress(tween.target, t);

		if (now > tween.end) {
			tween.onend(tween.target);
			tweens.splice(i--, 1);
		}
	}

	if (jobs.length || tweens.length) {
		ticking = requestAnimationFrame(tick);
	} else {
		ticking = 0;
	}
};

const liike = (handler) =>
	function (target, settings) {
		const { delay = 0 } = settings;
		const { duration = 0 } = settings;
		const { from = {} } = settings;
		const { to = {} } = settings;
		const { easing = 0 } = settings;
		const { onprogress = nullFunc } = settings;
		const { onstart = nullFunc } = settings;
		const { onend = nullFunc } = settings;

		jobs.push((now) => {
			const tween = new Tween(target, handler, {
				start: now + delay,
				end: now + delay + duration,
				from,
				to,
				easing: easing,
				onstart,
				onprogress,
				onend,
			});

			tweens.push(tween);
		});
		if (!ticking) {
			ticking = requestAnimationFrame(tick);
		}
	};

const transform = (target, data) => {
	let transformation = [];

	if (data.x != null) {
		transformation.push(`translateX(${data.x}px)`);
	}

	if (data.y != null) {
		transformation.push(`translateY(${data.y}px)`);
	}

	if (data.perspective != null) {
		transformation.push(`perspective(${data.perspective}px)`);
	}

	if (data.rotationX != null) {
		transformation.push(`rotateX(${data.rotationX}deg)`);
	}

	if (data.rotationY != null) {
		transformation.push(`rotateY(${data.rotationY}deg)`);
	}

	if (data.scaleX != null) {
		transformation.push(`scaleX(${data.scaleX})`);
	}

	if (data.scaleY != null) {
		transformation.push(`scaleY(${data.scaleY})`);
	}

	if (data.rotation != null) {
		transformation.push(`rotate(${data.rotation}deg)`);
	}

	if (transformation.length > 0) {
		setStyle(target, "transform", transformation.join(" "));
	}

	if (data.opacity != null) {
		setStyle(target, "opacity", data.opacity);
	}

	if (data.glow != null) {
		setStyle(
			target,
			"filter",
			`drop-shadow(0 0 ${target.dataset.blur} ${hexToRgbA(target.dataset.color, data.glow)})`
		);
	}
};

const tween = liike(transform);
// #endregion

// #region - SVGs
const svgs = {
	HEART: `<svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M480 156c0 162-224 325-224 325S32 318 32 156c0-91 70-125 108-125 77 0 116 66 116 66s39-66 116-66c38 0 108 34 108 125z" fill="#d0021b"/></svg>`,
	EARTH: `<svg class="earth-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="234" fill="#b8e986" stroke="#111111" stroke-width="22"/><path d="M256 32c-38 0-75 10-108 28l28 19 40-13 24 5 9 50 15-11 41-14 18 27-35 19-23 16-2 23-25 21-7 34-14 1 7-39-53-2-13 18h0v27l26 2 24 17-2 25 33 6v1l53-31 91 59-21 49-32 20-61 78-14-4 7-98-42-42 8-14-26-10-25-30-22-5-39-56h-4l-5 27-4-39 6-30-1-23-11-45a224 224 0 10356 264l-10-64-6-36-34-27 7-38 16-21 37-5A224 224 0 00256 32zm89 48h23v48l-32 16v-24zM222 247l30 4-4 7-24-5z" fill="#48baff" stroke="#111111" stroke-width="4"/></svg>`,
	MOON: `<svg viewBox="-10 -10 300 300" xmlns="http://www.w3.org/2000/svg"><g stroke="null"><path d="M140 6a135 135 0 110 270 135 135 0 010-270z" fill="#EFC75E"/><g transform="rotate(5 158 124)" fill="#DFA14F"><path d="M259 76c-10-17-23-32-39-43l-3-1a42 42 0 1042 44z"/><circle cx="183.6" cy="183.1" r="25.1"/><path d="M100 67c-18-5-36 6-41 24s6 36 24 41 36-6 41-24-6-36-24-41z"/><circle cx="99.9" cy="199.9" r="16.8"/></g></g></svg>`,
	MARS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 532 532"><path d="M512 256a256 256 0 11-512 0 256 256 0 01512 0z" fill="#fc6e51"/><g fill="#e9573f"><path d="M448 213c0 30-29 54-64 54s-64-24-64-54c0-29 29-53 64-53s64 24 64 53zM227 384c0 18-19 32-43 32-23 0-42-14-42-32s19-32 42-32c24 0 43 14 43 32zM164 235c0 23-24 42-54 42-29 0-53-19-53-42s24-43 53-43c30 0 54 19 54 43zM320 96l-3 1c-1 0-51 16-105 20-51 5-86-7-106-18-18-10-28-21-31-24L61 90c5 6 16 17 33 27a199 199 0 00120 22c56-5 105-21 109-22a11 11 0 00-3-21zM507 307c-10 2-60 12-109 16-101 9-136-12-136-12l-6-2a11 11 0 00-6 20c1 1 12 7 35 12a582 582 0 00115 4c41-4 82-11 101-15l6-23zM344 416l-6 2c-1 0-47 29-100 33a417 417 0 01-171-22c12 12 24 24 38 33a442 442 0 00135 11c58-5 107-36 109-37a11 11 0 00-5-20z"/></g></svg>`,
	DEATH_STAR: `<svg viewBox="-10 -10 532 532" xmlns="http://www.w3.org/2000/svg"><path fill="#cfcfd1" d="M512 256a256 256 0 11-512 0 256 256 0 01512 0z"/><path fill="#656d78" d="M510 291a262 262 0 002-41c-2 5-6 10-12 15-12 11-30 22-53 30-24 10-53 17-85 22a663 663 0 01-297-22c-23-8-41-19-53-30-6-5-10-10-12-15a338 338 0 002 41c45 36 142 62 254 62s209-26 254-62zM394 128c25 24 29 60 9 80s-55 16-80-9-29-61-9-80c20-20 56-16 80 9z"/></svg>`,
	SHIELD: `<svg class="shield-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 52a729 729 0 01-166 90c2 11 9 33 19 58a1125 1125 0 00106 194c10 12 18 22 26 28 7 6 13 9 15 9s8-3 15-9c8-6 16-16 26-28a1125 1125 0 00106-194c10-25 17-47 19-58a729 729 0 01-166-90zM124 62l-96 48-5 2v6c0 11 4 26 10 45l23 55 16-8a428 428 0 01-30-87l90-45-8-16zm264 0l-8 16 90 45a428 428 0 01-30 87l16 8a442 442 0 0033-100v-6l-5-2-96-48zM256 98l7 8c7 8 27 20 49 30l59 23 6 3v6a350 350 0 01-16 50 997 997 0 01-95 163c-3 2-5 4-10 5-5-1-7-3-10-5l-6-6-16-22a911 911 0 01-84-164c-3-8-5-15-5-21v-6l6-3 59-23c22-10 42-22 49-30l7-8zm0 26c-12 11-30 20-49 28-19 9-39 16-53 22l3 9 10 28a982 982 0 0086 152l3 3 3-3 14-20a897 897 0 0082-160 102 102 0 003-9c-14-6-34-13-53-22-19-8-37-17-49-28zm-57 304l-14 11s10 13 23 25c13 13 29 27 48 27s35-14 48-27c13-12 23-25 23-25l-14-11s-9 12-21 23c-12 12-28 22-36 22s-24-10-36-22c-12-11-21-23-21-23z" fill="#48baff"/></svg>`,
	SWORD: `<svg class="sword-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M492 23l-84 14-211 212c3 5 5 11 5 17s-2 12-5 16a53 53 0 00-55 15l-10-9 18-17-13-17-20 19-13-13 22-22-13-20-41 41 58 58a53 53 0 003 38l-73 72-14-15-25 25 15 15-9 8 27 27 9-8 14 14 25-24-14-15 72-72a53 53 0 0037 2l59 58 41-41-21-12-21 22-14-14 20-19-18-13-17 17-9-9a53 53 0 0015-55 30 30 0 0133 0l212-212 15-83zm-66 53l13 13-192 191-13-13L426 76zM181 298c20 0 35 16 35 35s-15 35-35 35c-19 0-34-16-34-35s15-35 34-35z" fill="#d0021b"/></svg>`,
	ALIEN: `<svg class="alien-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 33c-30 0-69 11-100 29-15 8-28 18-37 29-9 10-14 20-14 29l4 7c2 4 7 8 13 13l47 32c31 21 67 45 87 74 20-29 56-53 87-74l47-32c6-5 11-9 13-13l4-7c0-9-5-19-14-29-9-11-22-21-37-29-31-18-70-29-100-29z" fill="#7ed321"/><path d="M160 88c16 0 80 48 80 80-49-32-80-32-80-32-16-16-16-48 0-48z" fill="#417505"/><path d="M352 88c16 0 16 32 0 48 0 0-31 0-80 32 0-32 64-80 80-80z" class="selected" fill="#417505"/><path d="M124 216h-4l11 13c8 11 11 24 9 38-1 10-5 20-13 28l5 7a246 246 0 0125 49 63 63 0 0141-10c12 2 25 8 38 19l4-6c-4-16-11-35-20-53-19-38-47-72-67-79-10-4-20-6-29-6zM388 216c-9 0-19 2-29 6-20 7-48 41-67 79-9 18-16 37-20 53l4 6a78 78 0 0144-19c13-1 25 4 35 10a620 620 0 0125-49l5-7c-8-8-12-18-13-28a56 56 0 0120-51h-4z" fill="#417505"/><path d="M95 226h-5l-11 10c-20 18-33 48-39 83-6 34-4 72 6 104 7 22 18 42 32 56-7-25-12-54-13-82 0-39 10-78 37-105 1-2 3-3 6-4 9-7 13-15 15-24 1-9-2-18-6-25-5-7-12-12-20-13h-2zM417 226h-2c-8 1-15 6-20 13-4 7-7 16-6 25 2 9 6 17 15 24 3 1 5 2 6 4 27 27 37 66 37 105-1 28-6 57-13 82 14-14 25-34 32-56 10-32 12-70 6-104-6-35-19-65-39-83l-11-10h-5z" fill="#7ed321"/><path d="M224 237l-5 25a367 367 0 0137 81 323 323 0 0137-81l-5-25c-10 10-19 20-24 31l-8 16-8-16c-5-11-14-21-24-31z" fill="#417505"/><path d="M189 359h-2c-7 0-14 3-22 8a76 76 0 00-34 53c-3 17-3 36 1 58l22-45c6-11 11-21 18-28 3-3 6-6 11-8 5-1 12 1 15 4l15 16c3-3 6-8 9-15l8-23a67 67 0 00-35-20h-6zM323 359h-6c-10 2-21 7-35 20l8 23c3 7 6 12 9 15l15-16c3-3 10-5 15-4 5 2 8 5 11 8 7 7 12 17 18 28l22 45c4-22 4-41 1-58-5-23-15-41-34-53a47 47 0 00-24-8z" fill="#7ed321"/><path d="M256 363l-6 10-1 5s-4 16-11 31c-3 8-6 15-12 20-3 3-6 6-11 6-5 1-10-2-13-5l-4-3-10 4 3 4 19 20c15 13 35 24 46 24 12 0 31-11 46-24a133 133 0 0022-24l-10-4-4 3c-3 3-8 6-13 5-5 0-8-3-11-6-6-5-9-12-12-20-7-15-11-31-11-31l-1-5-6-10z" fill="#417505"/></svg>`,
	COIL: `<svg width="12" height="13" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill="#2D333A" d="M10.22 9.32c.32 0 .73.16 1.03.85.04.1.07.2.07.3 0 1.14-2.67 2.17-4.21 2.25l-.35.02c-2.3 0-4.44-1.2-5.54-3.12A6.06 6.06 0 014.86.85 7.32 7.32 0 017.06.5c.88 0 1.87.18 2.74.82 1.21.88 1.46 1.85 1.46 2.47 0 .27-.04.47-.08.6a2.77 2.77 0 01-2.3 1.9c-.25.02-.46.05-.66.05-.99 0-1.32-.4-1.32-.87 0-.62.6-1.36 1.03-1.36.05 0 .11.02.15.04.11.07.25.1.38.1l.11-.01c.35-.04.53-.27.53-.56 0-.53-.64-1.25-2.04-1.25-.44 0-.96.07-1.54.25a4.11 4.11 0 00-2.26 1.75 3.99 3.99 0 00-.18 4.16 4.23 4.23 0 003.68 2.04H7c1.99-.1 2.45-1.08 2.9-1.27.06-.01.19-.04.32-.04z"/></svg>`,
	STAR: `<svg class="star-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 38c-22 0-66 110-85 124-18 13-136 20-143 42-7 21 84 97 91 119 7 21-22 136-4 149s119-50 141-50 123 63 141 50-11-128-4-149c7-22 98-98 91-119-7-22-125-29-143-42-19-14-63-124-85-124z" fill="#f8e71c"/></svg>`,
	HOURGLASS: `<svg class="hourglass-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M93 19v42h331V19H93zm27 60v355h22V79h-22zm46 0c3 44 13 82 28 111 18 36 41 55 64 55s46-19 64-55c14-29 25-67 28-111H166zm209 0v355h23V79h-23zM258 265c-23 0-46 19-64 54-15 30-25 70-28 115h184c-3-45-13-85-28-115-18-35-41-54-64-54zM93 452v42h331v-42H93z" fill="#ffe0af"/></svg>`,
	ASTEROID: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M253 36l-18 2-15 32-33-13c-16 7-11 30-20 38-28 23-84 69-90 85-13 34-19 70-20 105 14 7 31 20 47 34 14 15 35 32 41 50l2 7-7 4c-11 5-9 17-11 26l-18-4c2-13 4-25 14-33a303 303 0 00-68-63c2 46 1 82 21 114l32 6v28l42-4-5 31c92 38 247-58 288-163 9-22 48-45 50-67 3-36-8-70-28-101-14 13-30 17-46 10l20 24-14 11-27-32-1-18-17-18-33 10-6-18 29-8-8-22c-3-12-2-25 5-36-36-5-73-17-106-17zm121 27c-4 5-4 13-2 22s7 19 13 28 14 18 22 24c23 13 42 8 39-17-2-16-17-30-23-36-13-13-38-35-49-21zm-36 4l-10 22-25 9-18-10zM233 96l31 11 28 47 32 14-8 16-37-16zm-43 31c9 0 19 3 25 12 6 5 17 8 28 13l-6 16-19-7-4 10a65 65 0 01-3 5c12 7 24 12 30 12l-2 18c-13-1-27-8-41-16a70 70 0 01-5 4l-20 10c3 15 3 30 3 42l-18-1-3-36h-18c0 13-2 28-12 42l-15-10c11-16 9-31 8-50-2-5-1-10 0-15 1-6 5-11 9-16a87 87 0 0163-33zm-1 18h-2c-8 1-17 4-23 7-7 4-17 11-23 19l-6 10c-1 5 2 9 6 10h13c10-2 21-7 28-12 6-4 12-10 16-17 4-12 0-17-9-17zm260 38l12 62-54 41 33-57zm-62 20l4 18-66 12-10 25-25 12 21-53zm-11 65l16 8c-7 15-10 24-9 33l18 2-2 18c-21-3-41-2-50 5-5 3-8 8-9 15-2 7-1 18 4 32l-43 14-6-17 28-9c-2-8-2-16-1-23 2-11 7-20 15-26l-7-17c-3-9 0-28 0-28s15 16 17 23l6 14 12-2c0-13 3-26 11-42zm-146 4l-21 47-2 65-17-68s36-44 40-44zm39 140a85 85 0 018 0c13 1 27 5 40 9l-5 18c-13-4-26-8-37-9l-15 1-15-14c7-3 14-5 21-5a76 76 0 013 0zm-39 15l14 13c-11 17-14 27-31 38l6-27c2-8 5-17 11-24z" fill="#cec3c3"/></svg>`,
	SOUND_ON: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 17H0V7h5v10zM7 7v10l9 5V2L7 7zm17 4h-5v2h5v-2zm-2-6l-4 2 1 2 4-2-1-2zm1 13l-4-3-1 2 4 2 1-2z"/></svg>`,
	SOUND_OFF: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 17H0V7h5v10zM7 7v10l9 5V2L7 7zm15 5l2-2-1-1-2 2-2-2-1 1 2 2-2 2 1 1 2-2 2 2 1-1-2-2z"/></svg>`,
	LOCK: `<svg class="lock" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 10v-4c0-3.313-2.687-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10 0v-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8z"/></svg>`,
	DISCORD: `<svg class="discord" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#7289da" d="M40 12s-5-4-10-4v1c4 1 7 3 9 5-4-2-8-4-15-4s-11 2-15 4c2-2 5-4 9-5V8c-6 1-10 4-10 4s-5 7-6 22c5 6 13 6 13 6l2-2-9-6c3 2 8 5 16 5s13-3 16-5l-9 6 2 2s8 0 13-6c-1-15-6-22-6-22zM18 30c-2 0-4-2-4-4s2-4 4-4 3 2 3 4-2 4-3 4zm13 0c-2 0-4-2-4-4s2-4 4-4 3 2 3 4-2 4-3 4z"/></svg>`,
	COFFEE: `<svg class="coffee" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#ef9e47" d="M12.874 6.999c4.737-4.27-.979-4.044.116-6.999-3.781 3.817 1.41 3.902-.116 6.999zm-2.78.001c3.154-2.825-.664-3.102.087-5.099-2.642 2.787.95 2.859-.087 5.099zm8.906 2.618c-.869 0-1.961-.696-1.961-1.618h-10.039c0 .921-1.13 1.618-2 1.618v1.382h14v-1.382zm-3.4 4.382l-1.286 8h-4.627l-1.287-8h7.2zm2.4-2h-12l2.021 12h7.959l2.02-12z"></path></svg>`,
};

const getSVG = (svg, ...colors) => {
	let svgIcon = svg;

	[...svg.matchAll(/#.{6}/g)].forEach((match, index) => {
		if (colors[index]) {
			svgIcon = svgIcon.replaceAt(match.index, colors[index]);
		}
	});

	return svgIcon;
};
// #endregion

// #region - Monetization
const monetization = document.monetization;

updatePremiumState = (isPremium) => {
	// TODO: Change something in game here!
	currentGameState.isPremium = isPremium;
	const worldButtons = querySelectorAll(".world-select button");

	if (worldButtons.length > 3) {
		worldButtons[3].classList.toggle(
			"locked",
			currentGameState.highestStageUnclocked < 3 || currentGameState.isPremium === false
		);
	}
	updateGameSpeedLock();
	updateLockIcons();
};

if (monetization) {
	addEventListener(monetization, "monetizationstart", () => {
		updatePremiumState(true);
	});
	addEventListener(monetization, "monetizationstop", () => {
		updatePremiumState(false);
	});
}
// #endregion

// #region - Save/Load Game
const saveGame = (state) => {
	localStorage.setItem("js13kgames-jam-2021", JSON.stringify(state));

	return state;
};

const loadGame = (forceNew = false) => {
	const state = JSON.parse(localStorage.getItem("js13kgames-jam-2021"));

	if (state == null || forceNew) {
		saveGame(currentGameState);
	} else {
		currentGameState = state;
	}
};
// #endregion

// #region - Sound
// https://killedbyapixel.github.io/ZzFX/
// https://codepen.io/KilledByAPixel/pen/BaowKzv
// zzfx() - the universal entry point -- returns a AudioBufferSourceNode
zzfx = (...t) => zzfxP(zzfxG(...t));

// zzfxP() - the sound player -- returns a AudioBufferSourceNode
zzfxP = (...t) => {
	let e = zzfxX.createBufferSource(),
		f = zzfxX.createBuffer(t.length, t[0].length, zzfxR);
	t.map((d, i) => f.getChannelData(i).set(d)),
		(e.buffer = f),
		e.connect(zzfxX.destination),
		e.start();
	return e;
};

// zzfxG() - the sound generator -- returns an array of sample data
zzfxG = (
	q = 1,
	k = 0.05,
	c = 220,
	e = 0,
	t = 0,
	u = 0.1,
	r = 0,
	F = 1,
	v = 0,
	z = 0,
	w = 0,
	A = 0,
	l = 0,
	B = 0,
	x = 0,
	G = 0,
	d = 0,
	y = 1,
	m = 0,
	C = 0
) => {
	let b = 2 * Math.PI,
		H = (v *= (500 * b) / Math.pow(zzfxR, 2)),
		I = ((0 < x ? 1 : -1) * b) / 4,
		D = (c *= ((1 + 2 * k * Math.random() - k) * b) / zzfxR),
		Z = [],
		g = 0,
		E = 0,
		a = 0,
		n = 1,
		J = 0,
		K = 0,
		f = 0,
		p,
		h;
	e = 99 + zzfxR * e;
	m *= zzfxR;
	t *= zzfxR;
	u *= zzfxR;
	d *= zzfxR;
	z *= (500 * b) / Math.pow(zzfxR, 3);
	x *= b / zzfxR;
	w *= b / zzfxR;
	A *= zzfxR;
	l = (zzfxR * l) | 0;
	for (h = (e + m + t + u + d) | 0; a < h; Z[a++] = f)
		++K % ((100 * G) | 0) ||
			((f = r
				? 1 < r
					? 2 < r
						? 3 < r
							? Math.sin(Math.pow(g % b, 3))
							: Math.max(Math.min(Math.tan(g), 1), -1)
						: 1 - (((((2 * g) / b) % 2) + 2) % 2)
					: 1 - 4 * Math.abs(Math.round(g / b) - g / b)
				: Math.sin(g)),
			(f =
				(l ? 1 - C + C * Math.sin((2 * Math.PI * a) / l) : 1) *
				(0 < f ? 1 : -1) *
				Math.pow(Math.abs(f), F) *
				q *
				zzfxV *
				(a < e
					? a / e
					: a < e + m
					? 1 - ((a - e) / m) * (1 - y)
					: a < e + m + t
					? y
					: a < h - d
					? ((h - a - d) / u) * y
					: 0)),
			(f = d ? f / 2 + (d > a ? 0 : ((a < h - d ? 1 : (h - a) / d) * Z[(a - d) | 0]) / 2) : f)),
			(p = (c += v += z) * Math.sin(E * x - I)),
			(g += p - p * B * (1 - ((1e9 * (Math.sin(a) + 1)) % 2))),
			(E += p - p * B * (1 - ((1e9 * (Math.pow(Math.sin(a), 2) + 1)) % 2))),
			n && ++n > A && ((c += w), (D += w), (n = 0)),
			!l || ++J % l || ((c = D), (v = H), (n = n || 1));
	return Z;
};

zzfxM = (n, f, t, e = 125) => {
	let l,
		o,
		z,
		r,
		g,
		h,
		x,
		a,
		u,
		c,
		d,
		i,
		m,
		p,
		G,
		M = 0,
		R = [],
		b = [],
		j = [],
		k = 0,
		q = 0,
		s = 1,
		v = {},
		w = ((zzfxR / e) * 60) >> 2;
	for (; s; k++)
		(R = [(s = a = d = m = 0)]),
			t.map((e, d) => {
				for (
					x = f[e][k] || [0, 0, 0],
						s |= !!f[e][k],
						G = m + (f[e][0].length - 2 - !a) * w,
						p = d == t.length - 1,
						o = 2,
						r = m;
					o < x.length + p;
					a = ++o
				) {
					for (
						g = x[o], u = (o == x.length + p - 1 && p) || (c != (x[0] || 0)) | g | 0, z = 0;
						z < w && a;
						z++ > w - 99 && u ? (i += (i < 1) / 99) : 0
					)
						(h = ((1 - i) * R[M++]) / 2 || 0),
							(b[r] = (b[r] || 0) - h * q + h),
							(j[r] = (j[r++] || 0) + h * q + h);
					g &&
						((i = g % 1),
						(q = x[1] || 0),
						(g |= 0) &&
							(R = v[[(c = x[(M = 0)] || 0), g]] =
								v[[c, g]] ||
								((l = [...n[c]]), (l[2] *= Math.pow(2, (g - 12) / 12)), g > 0 ? zzfxG(...l) : [])));
				}
				m = G;
			});
	return [b, j];
};

// zzfxV - global volume
zzfxV = 0.3;

// zzfxR - global sample rate
zzfxR = 44100;

// zzfxX - the common audio context
zzfxX = new (top.AudioContext || webkitAudioContext)();

const backgroundMusic = zzfxM(
	...[
		[
			[0.1, 0, 1e4, , , , , , , , , , 0.01, 6.8, -0.2],
			[0.35, 0, 84, , , , , 0.7, , , , 0.5, , 6.7, 1, 0.01],
			[0.25, 0, 60, , 0.1, , 2],
			[0.4, 0, 360, , , 0.12, 2, 2, , , , , , 9, , 0.1],
			[0.185, 0, 586, , , 0.25, 6],
			[0.4, 0, 360, , , 0.375, 2, 3.5],
			[0.3, 0, 490, , 0.25, 0.45, , , , , , , 0.2, , , , , , , 0.1],
			[0.185, 0, 386, , , 0.25, 6],
		],
		[
			[
				[
					,
					-1,
					8,
					,
					,
					,
					,
					,
					8,
					,
					8,
					,
					,
					,
					,
					,
					8,
					,
					6,
					,
					,
					,
					,
					,
					6,
					,
					6,
					,
					,
					,
					,
					,
					6,
					,
					13,
					,
					,
					,
					,
					,
					13,
					,
					13,
					,
					,
					,
					,
					,
					13,
					,
					8,
					,
					,
					,
					,
					,
					8,
					,
					8,
					,
					,
					,
					,
					,
					8,
					,
				],
				[
					2,
					-1,
					,
					20,
					8,
					8,
					20,
					8,
					,
					8,
					,
					20,
					,
					8,
					20,
					8,
					,
					20,
					,
					18,
					6,
					6,
					18,
					6,
					,
					18,
					,
					18,
					,
					6,
					18,
					6,
					,
					6,
					,
					25,
					13,
					13,
					25,
					13,
					,
					13,
					,
					25,
					13.75,
					13,
					25,
					13,
					,
					25,
					,
					20,
					8,
					8,
					20,
					8,
					,
					8,
					,
					20,
					,
					8,
					20,
					8,
					,
					20,
				],
				[
					,
					1,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
				],
				[
					1,
					-1,
					20,
					,
					,
					20,
					,
					,
					20,
					22.5,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
				],
				[
					3,
					-1,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
				],
				[
					5,
					1,
					20,
					20,
					15,
					,
					18,
					,
					13,
					15,
					,
					11,
					,
					6,
					8,
					,
					18,
					20,
					11,
					11,
					13,
					,
					10,
					,
					13,
					18,
					23,
					23,
					22,
					,
					18,
					,
					13,
					,
					11,
					11,
					13,
					,
					25,
					,
					11,
					13,
					25,
					25,
					11,
					,
					13,
					,
					6,
					,
					8,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
				],
			],
			[
				[
					,
					-1,
					6,
					,
					,
					,
					,
					,
					6,
					,
					6,
					,
					,
					,
					,
					,
					6,
					,
					11,
					,
					,
					,
					,
					,
					11,
					,
					11,
					,
					,
					,
					,
					,
					11,
					,
					13,
					,
					,
					,
					,
					,
					13,
					,
					13,
					,
					,
					,
					,
					,
					13,
					,
					8,
					,
					,
					,
					,
					,
					8,
					,
					8,
					,
					,
					,
					,
					,
					8,
					,
				],
				[
					2,
					-1,
					,
					18,
					6,
					6,
					18,
					6,
					,
					6,
					,
					18,
					,
					6,
					18,
					6,
					,
					6,
					,
					23,
					11,
					11,
					23,
					11,
					,
					23,
					,
					23,
					,
					11,
					23,
					11,
					,
					11,
					,
					25,
					13,
					13,
					25,
					13,
					,
					13,
					,
					25,
					13.75,
					13,
					25,
					13,
					,
					25,
					,
					20,
					8,
					8,
					20,
					8,
					,
					8,
					,
					20,
					,
					8,
					20,
					8,
					,
					20,
				],
				[
					,
					1,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
				],
				[
					1,
					-1,
					20,
					,
					,
					20,
					,
					,
					20,
					22.5,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
				],
				[
					3,
					-1,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
				],
				[
					5,
					1,
					18,
					18,
					13,
					,
					11,
					,
					10,
					11,
					,
					11,
					,
					13,
					10,
					,
					11,
					13,
					23,
					23,
					22,
					,
					18,
					,
					13,
					,
					11,
					10,
					,
					18,
					11,
					,
					11,
					18,
					11,
					11,
					13,
					,
					25,
					,
					18,
					23,
					25,
					23,
					18,
					,
					23,
					23,
					18,
					,
					20,
					,
					20,
					18,
					11,
					,
					6,
					8,
					,
					,
					,
					,
					,
					,
					,
					,
				],
			],
			[
				[, -1, 8, , , , , , 8, , 8, , , , , , 8, , 8, , , , , , 8, , 8, , , , , , 8, ,],
				[
					2,
					-1,
					,
					20,
					8,
					8,
					20,
					8,
					,
					8,
					,
					20,
					,
					8,
					20,
					8,
					,
					20,
					,
					20,
					8,
					8,
					20,
					8,
					,
					8,
					,
					20,
					,
					8,
					20,
					8,
					,
					8,
				],
				[
					,
					1,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
				],
				[
					1,
					-1,
					20,
					,
					,
					20,
					,
					,
					20,
					22.5,
					20,
					,
					,
					20,
					,
					,
					20,
					20.5,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.5,
				],
				[3, -1, , , , , 32, , , , , , , , 32, , , , , , , , 32, , , , , , , , 32, , , ,],
			],
			[
				[
					,
					-1,
					11,
					,
					,
					,
					,
					,
					11,
					,
					11,
					,
					,
					,
					,
					,
					11,
					,
					11,
					,
					,
					,
					,
					,
					11,
					,
					11,
					,
					,
					,
					,
					,
					11,
					,
					16,
					,
					,
					,
					,
					,
					16,
					,
					16,
					,
					,
					,
					,
					,
					16,
					,
					16,
					,
					,
					,
					,
					,
					16,
					,
					16,
					,
					,
					,
					,
					,
					16,
					,
				],
				[
					2,
					-1,
					,
					23,
					11,
					11,
					23,
					11,
					,
					11,
					,
					23,
					,
					11,
					23,
					11,
					,
					23,
					,
					23,
					11,
					11,
					23,
					11,
					,
					11,
					,
					23,
					,
					11,
					23,
					11,
					,
					11,
					,
					28,
					16,
					16,
					28,
					16,
					,
					16,
					,
					28,
					,
					16,
					28,
					16,
					,
					16,
					,
					28,
					16,
					16,
					28,
					16,
					,
					16,
					,
					28,
					,
					16,
					28,
					16,
					,
					16,
				],
				[
					,
					1,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
				],
				[
					1,
					-1,
					20,
					,
					,
					20,
					,
					,
					20,
					22.5,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
				],
				[
					3,
					-1,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
				],
				[
					6,
					1,
					15,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					18,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					15,
					18,
					15,
					18,
					18,
					,
					,
					,
					20,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					23,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					20,
					23,
					20,
					23,
				],
			],
			[
				[
					,
					-1,
					13,
					,
					,
					,
					,
					,
					13,
					,
					13,
					,
					,
					,
					,
					,
					13,
					,
					13,
					,
					,
					,
					,
					,
					13,
					,
					13,
					,
					,
					,
					,
					,
					13,
					,
					15,
					,
					,
					,
					,
					,
					15,
					,
					15,
					,
					,
					,
					,
					,
					15,
					,
					15,
					,
					,
					,
					,
					,
					15,
					,
					15,
					,
					,
					,
					,
					,
					15,
					,
				],
				[
					2,
					-1,
					,
					25,
					13,
					13,
					25,
					13,
					,
					25,
					,
					25,
					,
					13,
					25,
					13,
					,
					13,
					,
					25,
					13,
					13,
					25,
					13,
					,
					25,
					,
					25,
					,
					13,
					25,
					13,
					,
					25,
					,
					27,
					15,
					15,
					27,
					15,
					,
					27,
					,
					27,
					,
					15,
					27,
					15,
					,
					15,
					,
					27,
					15,
					15,
					27,
					15,
					,
					27,
					,
					27,
					,
					15,
					27,
					15,
					,
					15,
				],
				[
					,
					1,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
				],
				[
					1,
					-1,
					20,
					,
					,
					20,
					,
					,
					20,
					22.5,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
				],
				[
					3,
					-1,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
				],
				[
					6,
					1,
					25,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					20,
					23,
					25,
					,
					27,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
					,
				],
			],
			[
				[
					2, -1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
					3, 3, 3, 3,
				],
				[
					,
					1,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					22,
					32,
					22,
					22,
					32,
					32,
					22,
					32,
					32,
				],
				[
					1,
					-1,
					20,
					,
					,
					20,
					,
					,
					20,
					22.5,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
				],
				[3, -1, , , , , 32, , , , , , , , 32, , , , , , , , 32, , , , , , , , 32, , , ,],
				[
					4,
					1,
					3,
					4,
					4,
					4,
					4,
					4,
					4,
					4,
					5,
					5,
					5,
					5,
					5,
					5,
					5,
					5,
					6,
					6,
					6,
					6,
					6,
					6,
					6,
					6,
					,
					,
					,
					,
					,
					,
					,
					,
				],
				[7, 1, , , , , , , , , , , , , , , , , , , , , , , , , 18, 18, , 18, 13, 13, 10, 10],
			],
			[
				[
					4,
					-1,
					15,
					15,
					15,
					,
					15,
					,
					15,
					15,
					,
					15,
					,
					15,
					15,
					,
					15,
					15,
					15,
					15,
					15,
					,
					15,
					,
					15,
					15,
					27,
					15,
					,
					15,
					15,
					,
					15,
					15,
					15,
					15,
					15,
					,
					15,
					,
					15,
					15,
					15,
					15,
					15,
					,
					15,
					15,
					15,
					,
					15,
					,
					15,
					15,
					15,
					,
					15,
					15,
					,
					,
					,
					,
					,
					,
					,
					,
				],
				[
					1,
					-1,
					20,
					,
					,
					20,
					,
					,
					20,
					22.5,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
					20,
					,
					,
					20,
					,
					,
					20,
					,
					20,
					,
					,
					20,
					,
					,
					20,
					20.25,
				],
				[
					,
					-1,
					,
					22,
					22,
					,
					,
					22,
					,
					,
					,
					22,
					22,
					,
					,
					22,
					,
					,
					,
					22,
					22,
					,
					,
					22,
					,
					22,
					,
					22,
					22,
					,
					,
					22,
					,
					,
					,
					22,
					22,
					,
					,
					22,
					,
					22,
					,
					22,
					22,
					,
					,
					22,
					,
					,
					,
					22,
					22,
					,
					,
					22,
					,
					22,
					,
					22,
					22,
					,
					,
					22,
					,
					,
				],
				[
					3,
					-1,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
					,
					,
					,
					,
					32,
					,
					,
					,
				],
			],
		],
		[0, 1, 2, 1, 3, 4, 5],
		,
		{
			instruments: ["", "", "", "", "", "", "", ""],
			patterns: ["", "", "", "", "", "", ""],
			title: "Untitled song",
		},
	]
);

const selectCardSound = zzfxG(
	...[1.65, , 527, 0.08, 0.34, 0.62, , 0.75, , 0.1, -84, 0.05, 0.03, , , 0.1, 0.19, 0.83, 0.09, 0.1]
);

const cardExpiresSound = zzfxG(
	...[
		1.02,
		,
		697,
		0.01,
		0.34,
		0.12,
		,
		1.61,
		-6.2,
		-0.1,
		-223,
		,
		0.16,
		,
		23,
		-0.1,
		0.01,
		0.79,
		0.02,
		0.01,
	]
);

const newCardSound = zzfxG(
	...[1.89, , 1634, 0.01, 0.06, 0.2, 1, 0.64, , , , , , , 8.7, , 0.05, 0.51, 0.07, 0.11]
);

const laserShotSound = zzfxG(
	...[, , 471, , 0.09, 0.47, 4, 1.06, -6.7, , , , , 0.9, 61, 0.1, , 0.82, 0.09, 0.13]
);
const rocketLaunchSound = zzfxG(...[, , 941, 0.8, , 0.8, 4, 0.74, -222, , , , , 0.8, , 1]);
const explosionSound = zzfxG(...[, , 333, 0.01, 0, 0.9, 4, 1.9, , , , , , 0.5, , 0.6]);

const blipSound = zzfxG(...[1.99, , 1038, 0.04, , 0.05, , 2.71, , 15, , , 0.17, 0.2, -2.1, , 0.14]);
const winSound = zzfxG(
	...[
		1.02,
		,
		127,
		0.04,
		0.4,
		0.96,
		,
		1.11,
		-3.3,
		,
		166,
		0.07,
		0.18,
		-0.1,
		,
		-0.2,
		,
		0.79,
		0.06,
		0.12,
	]
);
const loseSound = zzfxG(
	...[
		1.94,
		,
		372,
		0.05,
		0.03,
		0.74,
		1,
		0.26,
		3.6,
		7.5,
		-38,
		0.04,
		0.07,
		0.2,
		,
		,
		0.19,
		0.48,
		0.09,
		0.05,
	]
);

let soundOnElement;
let soundOffElement;

const enableSound = () => {
	zzfxX.resume();
	currentGameState.soundOn = true;
	saveGame(currentGameState);
	setStyle(soundOffElement, "display", "none");
	setStyle(soundOnElement, "display", "block");
};

const disableSound = () => {
	zzfxX.suspend();
	currentGameState.soundOn = false;
	saveGame(currentGameState);
	setStyle(soundOnElement, "display", "none");
	setStyle(soundOffElement, "display", "block");
};

const initSound = () => {
	zzfxX.suspend();

	addContent(gameControlElement, `<button id="sound-on">${getSVG(svgs.SOUND_ON)}</button>`);
	addContent(gameControlElement, `<button id="sound-off">${getSVG(svgs.SOUND_OFF)}</button>`);

	soundOnElement = querySelector("#sound-on", gameControlElement);
	soundOffElement = querySelector("#sound-off", gameControlElement);

	if (currentGameState.soundOn === null) {
		showPopup(
			"Play with sound?",
			[
				{
					content: "No",
					action: "close",
				},
				{
					content: "Yes",
					action: () => {
						enableSound();
						showTutorial();
					},
				},
			],
			() => {
				disableSound();
				showTutorial();
			},
			false,
			"",
			500
		);
	} else if (currentGameState.soundOn === true) {
		addEventListener(document, "click", function startInitialSound() {
			zzfxX.resume();
			removeEventListener(document, "click", startInitialSound);
		});
	} else {
		disableSound();
	}

	if (currentGameState.soundOn === true) {
		enableSound();
	} else {
		disableSound();
	}

	addEventListener(soundOnElement, "click", () => {
		disableSound();
	});

	addEventListener(soundOffElement, "click", () => {
		enableSound();
	});
};

const playSound = (sound) => {
	if (currentGameState.soundOn === true) {
		zzfxP(sound);
	}
};
// #endregion

// #region - Game Engine
const removeCard = (cardIndex) => {
	cardSlotElements[cardIndex].style.opacity = 0;
	currentGameState.cards[cardIndex] = null;
};

const addCard = (cardIndex) => {
	const cardTypes = worlds[currentGameState.world].cardTypes;

	if (currentGameState.cards[cardIndex] === null) {
		let chance = randomIntFromInterval(0, 100);

		for (let i = 0; i < cardTypes.length; i += 1) {
			if (cardTypes[i].chance >= chance) {
				currentGameState.cards[cardIndex] = new cards[cardTypes[i].card](cardIndex);
				break;
			} else {
				chance -= cardTypes[i].chance;
			}
		}

		if (currentGameState.cards[cardIndex] == null) {
			currentGameState.cards[cardIndex] = new cards[
				cardTypes[randomIntFromInterval(0, cardTypes.length - 1)].card
			](cardIndex);
		}
	} else {
		currentGameState.cards[cardIndex] = new cards[currentGameState.cards[cardIndex].class](
			cardIndex,
			currentGameState.cards[cardIndex]
		);
	}

	addAnimationToQueue(
		animationTarget.DRAW_CARD,
		() => {
			playSound(newCardSound);
			zoomBounceAndFadeIn(currentGameState.cards[cardIndex].cardContainerElement);
		},
		500
	);
};

let timeDelayBeforeNextRoundOfAnimations = Date.now();

const playAnimations = () => {
	let animationDelay = Math.max(0, timeDelayBeforeNextRoundOfAnimations - Date.now());

	animationQueue
		.sort((a, b) => {
			if (a.order < b.order) {
				return -1;
			}
			if (a.order > b.order) {
				return 1;
			}

			return 0;
		})
		.forEach((animation) => {
			setTimeout(() => {
				if (animation.order === animationTarget.PLAY_CARD) {
					playSound(selectCardSound);
				}
				animation.animation();
			}, animationDelay / currentGameState.gameSpeed);
			animationDelay += animation.delay / currentGameState.gameSpeed;
		});

	timeDelayBeforeNextRoundOfAnimations = Date.now() + animationDelay;

	animationQueue.length = 0;
};

const nextYear = () => {
	const oldYear = currentGameState.year;
	const newYear = currentGameState.year + 1;

	addAnimationToQueue(
		animationTarget.YEAR,
		() => {
			animateNumber(yearAmountElement, oldYear, newYear);
			glowElementInAndOut(yearSvgElement, "5px", "#48baff", 300);
		},
		700
	);

	currentGameState.year += 1;
};

const playerHasLost = () => {
	if (currentGameState.health <= 0) {
		return true;
	}

	return false;
};

const playerHasWon = () => {
	if (currentGameState.year >= currentGameState.maxYear) {
		return true;
	}

	return false;
};

const openWorld = (world) => {
	currentGameState.gameEnded = false;
	if (currentGameState.highestStageUnclocked < world) {
		world = currentGameState.highestStageUnclocked;
	}

	if (currentGameState.isPremium === false && world > 2) {
		world = 2;
	}

	currentGameState.cards.forEach((card, cardIndex) => {
		if (card !== null) {
			removeCard(cardIndex);
		}
	});

	currentGameState.world = world;
	currentGameState.worldStartedAt = Date.now();
	Object.assign(currentGameState, worlds[currentGameState.world]);

	setupWorld(currentGameState.world);
};

const showWorldSelectScreen = () => {
	showPopup(
		`Select a World<p>Become <b>V.I.P.</b> and unlock <b>4x</b> speed and <b>Death Star</b> world with <a target="_blank" href="https://coil.com/">Coil</a> membership!</p>`,
		[
			{
				content: getSVG(svgs.MOON) + "<b>Moon</b>",
				action: () => {
					openWorld(0);
				},
				locked: false,
			},
			{
				content: getSVG(svgs.EARTH) + "<b>Earth</b>",
				action: () => {
					openWorld(1);
				},
				locked: currentGameState.highestStageUnclocked < 1,
			},
			{
				content: getSVG(svgs.MARS) + "<b>Mars</b>",
				action: () => {
					openWorld(2);
				},
				locked: currentGameState.highestStageUnclocked < 2,
			},
			{
				content: getSVG(svgs.DEATH_STAR) + `<b>Death Star <b class="vip">V.I.P.</b></b>`,
				action: () => {
					openWorld(3);
				},
				locked: currentGameState.highestStageUnclocked < 3 || currentGameState.isPremium === false,
			},
		],
		() => {},
		true,
		"world-select"
	);
};

const retryWorld = () => {
	openWorld(currentGameState.world);
};

const nextWorld = () => {
	currentGameState.world += 1;
	openWorld(currentGameState.world);
};

const gameIsFinished = () => {
	if (currentGameState.isPremium) {
		if (currentGameState.world >= 3) {
			return true;
		} else {
			return false;
		}
	} else {
		if (currentGameState.world >= 2) {
			return true;
		} else {
			return false;
		}
	}
};

const showResultScreen = (message) => {
	currentGameState.gameEnded = true;
	const buttons = [
		{
			content: "World Select",
			action: showWorldSelectScreen,
		},
	];

	let popUpClass = "";

	if (playerHasLost()) {
		popUpClass = "lost";
		buttons.push({
			content: "Try Again",
			action: retryWorld,
		});
	}

	if (playerHasWon()) {
		popUpClass = `won`;

		if (currentGameState.world === 0) {
			popUpClass += " moon";
		}

		if (currentGameState.world === 1) {
			popUpClass += " earth";
		}

		if (currentGameState.world === 2) {
			popUpClass += " mars";
		}

		if (currentGameState.world === 3) {
			popUpClass += " death-star";
		}

		if (gameIsFinished() === false) {
			buttons.push({
				content: "Next World",
				action: nextWorld,
			});
		}
	}

	addAnimationToQueue(
		animationTarget.END_GAME,
		() => {
			if (playerHasLost()) {
				playSound(loseSound);
			}
			if (playerHasWon()) {
				playSound(winSound);
			}
			showPopup(message, buttons, () => {}, true, popUpClass, 500);
		},
		1500
	);
};

const playCard = (cardIndex) => {
	if (playerHasLost()) {
		return;
	}

	if (playerHasWon()) {
		return;
	}

	if (currentGameState.cards[cardIndex]) {
		currentGameState.cards[cardIndex].play();

		currentGameState.cards.forEach((card, index) => {
			if (card !== null && (card.played === true || cardIndex != index)) {
				if (typeof card.onTurn === "function") {
					card.onTurn();
				}
			}
		});

		currentGameState.cards.forEach((card) => {
			if (card !== null && typeof card.onEndTurn === "function") {
				card.onEndTurn();
			}
		});

		nextYear();

		if (playerHasLost()) {
			showResultScreen(`${getSVG(worlds[currentGameState.world].icon)} You Lost!`);
		}

		if (playerHasWon()) {
			if (currentGameState.world === currentGameState.highestStageUnclocked) {
				currentGameState.highestStageUnclocked += 1;
			}

			if (currentGameState.hasDoubleSpeedUnlocked === false) {
				currentGameState.hasDoubleSpeedUnlocked = true;
				updateGameSpeedLock();
				showResultScreen(
					`${getSVG(worlds[currentGameState.world].icon)} You defended this world in ${getDuration(
						currentGameState.worldStartedAt,
						Date.now()
					)}!<p>You have now unlocked <b>2x</b> speed!</p>`
				);
			} else if (gameIsFinished() && currentGameState.gameFinishedAt === null) {
				currentGameState.gameFinishedAt = Date.now();
				showResultScreen(
					`${getSVG(worlds[currentGameState.world].icon)} You beat this world in ${getDuration(
						currentGameState.worldStartedAt,
						Date.now()
					)}!<p><b>Congratulations!</b> You have completed the game in ${getDuration(
						currentGameState.firstPlayAt,
						currentGameState.gameFinishedAt
					)}!</p><p>Join our <a target="_blank" href="https://discord.gg/99ZvC6W3r4">Discord</a>, <a target="_blank" href="https://martintale.com/about-me?ref=go-away#message-me">Message Me</a> directly or <a target="_blank" href="https://ko-fi.com/martintale?ref=go-away">Buy me a Coffee</a>!</p>`
				);
			} else {
				showResultScreen(
					`${getSVG(worlds[currentGameState.world].icon)} You defended this world in ${getDuration(
						currentGameState.worldStartedAt,
						Date.now()
					)}!`
				);
			}

			updateLockIcons();
		}

		playAnimations();
	}

	saveGame(currentGameState);
};
// #endregion

// #region - Cards
class HealthCard {
	constructor(slot, data) {
		this.slot = slot;
		this.played = false;
		this.health = Math.floor(randomIntFromInterval(10, 20) * (1 + currentGameState.year / 10));

		this.turnsBeforeCardExpires = randomIntFromInterval(3, 5);

		Object.assign(this, data);

		this.cardContainerElement = cardSlotElements[slot];

		addContent(
			this.cardContainerElement,
			`<div class="card">
				<div class="effect">${this.health}</div>
				${getSVG(svgs.HEART)}
			</div>`
		);

		this.cardElement = querySelector(".card", this.cardContainerElement);

		checkExpireStatus(this);
	}

	play() {
		this.played = true;

		const oldHealth = currentGameState.health;
		const newHealth = currentGameState.health + this.health;

		currentGameState.health = newHealth;
		detachElement(this.cardElement);
		removeCard(this.slot);
		addCard(this.slot);

		addAnimationToQueue(
			animationTarget.PLAY_CARD,
			() => {
				playAndFadeOut(this.cardElement, healthSvgElement, () => {
					this.cardElement.remove();
				}); // 1,650 ms
				animateNumber(healthAmountElement, oldHealth, newHealth, "green", 1150);
				baunceElement(healthElement, 5, "top", 1150);
				glowElementInAndOut(healthSvgElement, "5px", "#d0021b", 200, 1150);
			},
			1650
		);
	}

	onTurn() {
		this.turnsBeforeCardExpires -= 1;

		if (this.turnsBeforeCardExpires > 2) {
			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					// glowElementInAndOut(this.cardElement, "5px", "#666", 0, 0);
				},
				200
			);
		} else if (this.turnsBeforeCardExpires <= 0) {
			detachElement(this.cardElement);
			removeCard(this.slot);
			addCard(this.slot);

			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					playSound(cardExpiresSound);
					this.cardElement.style.filter = "grayscale(1)";
					requestAnimationFrame(() => {
						baunceElement(this.cardElement, 20, "top");
						zoomUpAndFadeOut(this.cardElement, 500, () => {
							this.cardElement.remove();
						});
					});
				},
				900
			);
		} else {
			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					checkExpireStatus(this);
				},
				300
			);
		}
	}

	toJSON() {
		return {
			class: 0,
			health: this.health,
			turnsBeforeCardExpires: this.turnsBeforeCardExpires,
		};
	}
}

class ShieldCard {
	constructor(slot, data) {
		this.slot = slot;
		this.played = false;
		this.shield = 1;

		this.turnsBeforeCardExpires = randomIntFromInterval(2, 4);

		Object.assign(this, data);

		this.cardContainerElement = cardSlotElements[slot];

		addContent(
			this.cardContainerElement,
			`<div class="card">
				<div class="effect">${this.shield}</div>
				${getSVG(svgs.SHIELD)}
			</div>`
		);

		this.cardElement = querySelector(".card", this.cardContainerElement);

		checkExpireStatus(this);
	}

	play() {
		this.played = true;

		const oldShield = currentGameState.shield;
		const newShield = currentGameState.shield + this.shield;

		currentGameState.shield = newShield;
		detachElement(this.cardElement);
		removeCard(this.slot);
		addCard(this.slot);

		addAnimationToQueue(
			animationTarget.PLAY_CARD,
			() => {
				playAndFadeOut(this.cardElement, shieldSvgElement, () => {
					this.cardElement.remove();
				}); // 1,650 ms
				animateNumber(shieldAmountElement, oldShield, newShield, "green", 1150);
				baunceElement(shieldElement, 5, "top", 1150);
				glowElementInAndOut(shieldSvgElement, "5px", "#48baff", 200, 1150);
			},
			1650
		);
	}

	onTurn() {
		this.turnsBeforeCardExpires -= 1;

		if (this.turnsBeforeCardExpires > 2) {
			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					// glowElementInAndOut(this.cardElement, "5px", "#666", 0, 0);
				},
				200
			);
		} else if (this.turnsBeforeCardExpires <= 0) {
			detachElement(this.cardElement);
			removeCard(this.slot);
			addCard(this.slot);

			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					playSound(cardExpiresSound);
					this.cardElement.style.filter = "grayscale(1)";
					requestAnimationFrame(() => {
						baunceElement(this.cardElement, 20, "top");
						zoomUpAndFadeOut(this.cardElement, 500, () => {
							this.cardElement.remove();
						});
					});
				},
				900
			);
		} else {
			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					checkExpireStatus(this);
				},
				300
			);
		}
	}

	toJSON() {
		return {
			class: 1,
			shield: this.shield,
			turnsBeforeCardExpires: this.turnsBeforeCardExpires,
		};
	}
}

class DamageCard {
	constructor(slot, data) {
		this.slot = slot;
		this.played = false;
		this.damage = Math.floor(1 + currentGameState.year / 20);

		this.turnsBeforeCardExpires = randomIntFromInterval(2, 4);

		Object.assign(this, data);

		this.cardContainerElement = cardSlotElements[slot];

		addContent(
			this.cardContainerElement,
			`<div class="card">
				<div class="effect">${this.damage}</div>
				${getSVG(svgs.SWORD)}
			</div>`
		);

		this.cardElement = querySelector(".card", this.cardContainerElement);

		checkExpireStatus(this);
	}

	play() {
		this.played = true;

		const oldDamage = currentGameState.damage;
		const newDamage = currentGameState.damage + this.damage;

		currentGameState.damage = newDamage;
		detachElement(this.cardElement);
		removeCard(this.slot);
		addCard(this.slot);

		addAnimationToQueue(
			animationTarget.PLAY_CARD,
			() => {
				playAndFadeOut(this.cardElement, damageSvgElement, () => {
					this.cardElement.remove();
				}); // 1,650 ms
				animateNumber(damageAmountElement, oldDamage, newDamage, "green", 1150);
				baunceElement(damageElement, 5, "top", 1150);
				glowElementInAndOut(damageSvgElement, "5px", "#d0021b", 200, 1150);
			},
			1650
		);
	}

	onTurn() {
		this.turnsBeforeCardExpires -= 1;

		if (this.turnsBeforeCardExpires > 2) {
			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					// glowElementInAndOut(this.cardElement, "5px", "#666", 0, 0);
				},
				200
			);
		} else if (this.turnsBeforeCardExpires <= 0) {
			detachElement(this.cardElement);
			removeCard(this.slot);
			addCard(this.slot);

			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					playSound(cardExpiresSound);
					this.cardElement.style.filter = "grayscale(1)";
					requestAnimationFrame(() => {
						baunceElement(this.cardElement, 20, "top");
						zoomUpAndFadeOut(this.cardElement, 500, () => {
							this.cardElement.remove();
						});
					});
				},
				900
			);
		} else {
			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					checkExpireStatus(this);
				},
				200
			);
		}
	}

	toJSON() {
		return {
			class: 2,
			damage: this.damage,
			turnsBeforeCardExpires: this.turnsBeforeCardExpires,
		};
	}
}

class Enemy {
	play() {
		this.played = true;

		const oldHealth = this.health;
		const newHealth = this.health - currentGameState.damage;

		this.health = newHealth;

		if (newHealth > 0) {
			addAnimationToQueue(
				animationTarget.PLAY_CARD,
				() => {
					playSound(explosionSound);
					animateNumber(this.healthAmountElement, oldHealth, newHealth, "red");
					baunceElement(this.cardElement, 20, "top");
				},
				900
			);
		} else {
			detachElement(this.cardElement);
			removeCard(this.slot);
			addCard(this.slot);

			addAnimationToQueue(
				animationTarget.PLAY_CARD,
				() => {
					playSound(explosionSound);
					animateNumber(this.healthAmountElement, oldHealth, 0, "red");
					baunceElement(this.cardElement, 20, "top");
					zoomUpAndFadeOut(this.cardElement, 500, () => {
						this.cardElement.remove();
					});
				},
				900
			);
		}
	}

	onTurn() {
		if (this.turns > 1) {
			const oldTurns = this.turns;
			const newTurns = this.turns - 1;
			this.turns = newTurns;

			addAnimationToQueue(
				animationTarget.CARD_TURN,
				() => {
					playSound(blipSound);
					animateNumber(this.turnsAmountElement, oldTurns, newTurns, "red");
					glowElementInAndOut(this.cardElement, "5px", "#f00", 300, 0);
				},
				800
			);
		} else {
			if (currentGameState.shield > 0) {
				const oldShield = currentGameState.shield;
				const newShield = currentGameState.shield - 1;

				currentGameState.shield = newShield;
				detachElement(this.cardElement);
				removeCard(this.slot);
				addCard(this.slot);

				addAnimationToQueue(
					animationTarget.CARD_TURN,
					() => {
						playSound(rocketLaunchSound);
						setTimeout(() => {
							playSound(explosionSound);
						}, 850);
						playAndFadeOut(this.cardElement, shieldSvgElement, () => {
							this.cardElement.remove();
						}); // 1,650 ms
						animateNumber(shieldAmountElement, oldShield, newShield, "red", 1150);
						baunceElement(shieldElement, 5, "top", 1150);
						glowElementInAndOut(shieldSvgElement, "5px", "#48baff", 200, 1150);
						glowElementInAndOut(this.cardElement, "5px", "#f00", 0, 0);
					},
					1650
				);
			} else {
				const oldHealth = currentGameState.health;
				const newHealth = currentGameState.health - this.damage;

				currentGameState.health = newHealth;
				detachElement(this.cardElement);
				removeCard(this.slot);
				addCard(this.slot);

				addAnimationToQueue(
					animationTarget.CARD_TURN,
					() => {
						playSound(rocketLaunchSound);
						setTimeout(() => {
							playSound(explosionSound);
						}, 850);
						playAndFadeOut(this.cardElement, healthSvgElement, () => {
							this.cardElement.remove();
						}); // 1,650 ms
						animateNumber(healthAmountElement, oldHealth, newHealth, "red", 1150);
						baunceElement(healthElement, 5, "top", 1150);
						glowElementInAndOut(healthSvgElement, "5px", "#d0021b", 200, 1150);
						glowElementInAndOut(this.cardElement, "5px", "#f00", 0, 0);
					},
					1650
				);
			}
		}
	}

	onEndTurn() {
		checkDangerStatus(this);
	}

	toJSON() {
		return {
			class: this.cardClass,
			health: this.health,
			turns: this.turns,
			shield: this.shield,
			damage: this.damage,
		};
	}
}

const decorateCard = (slot, data, card, icon) => {
	card.slot = slot;
	card.played = false;

	Object.assign(card, data);

	card.cardContainerElement = cardSlotElements[slot];

	let stats = `<div class="stats">`;
	if (card.damage > 0) {
		stats += `<div class="damage">${getSVG(svgs.SWORD)}<b>${card.damage}</b></div>`;
	}
	if (card.turns > 0) {
		stats += `<div class="turns">${getSVG(svgs.HOURGLASS)}<b>${card.turns}</b></div>`;
	} else {
		card.turns = null;
	}
	if (card.shield > 0) {
		stats += `<div class="shield">${getSVG(svgs.SHIELD)}<b>${card.shield}</b></div>`;
	}
	if (card.health > 0) {
		stats += `<div class="health">${getSVG(svgs.HEART)}<b>${card.health}</b></div>`;
	}
	stats += `</div>`;

	addContent(card.cardContainerElement, `<div class="card enemy">${stats}${icon}</div>`);

	card.cardElement = querySelector(".card", card.cardContainerElement);

	card.damageAmountElement = querySelector(".damage b", card.cardContainerElement);
	card.turnsAmountElement = querySelector(".turns b", card.cardContainerElement);
	card.shieldAmountElement = querySelector(".shield b", card.cardContainerElement);
	card.healthAmountElement = querySelector(".health b", card.cardContainerElement);

	checkDangerStatus(card);
};

class AsteroidCard extends Enemy {
	constructor(slot, data) {
		super();
		this.cardClass = 3;

		this.damage = Math.round(20 * (1 + currentGameState.year / 20));
		this.turns = Math.max(2, randomIntFromInterval(2, 4) - Math.floor(currentGameState.year / 15));
		this.shield = 0;
		this.health = Math.floor(randomIntFromInterval(1, 2) * (1 + currentGameState.year / 10));

		decorateCard(slot, data, this, getSVG(svgs.ASTEROID));
	}
}

class AlienCard extends Enemy {
	constructor(slot, data) {
		super();
		this.cardClass = 4;

		this.damage = Math.round(100 * (1 + currentGameState.year / 20));
		this.turns = Math.max(2, randomIntFromInterval(4, 5) - Math.floor(currentGameState.year / 15));
		this.shield = Math.floor(randomIntFromInterval(0, 1) * (1 + currentGameState.year / 30));
		this.health = Math.floor(randomIntFromInterval(3, 4) * (1 + currentGameState.year / 10));

		decorateCard(slot, data, this, getSVG(svgs.ALIEN));
	}
}

class PlanetCard extends Enemy {
	constructor(slot, data) {
		super();
		this.cardClass = 5;

		this.damage = Math.round(50 * (1 + currentGameState.year / 20));
		this.turns = Math.max(2, randomIntFromInterval(3, 5) - Math.floor(currentGameState.year / 15));
		this.shield = 0;
		this.health = Math.floor(randomIntFromInterval(2, 3) * (1 + currentGameState.year / 10));

		decorateCard(slot, data, this, getSVG(svgs.MOON));
	}
}

class DeathStarCard extends Enemy {
	constructor(slot, data) {
		super();
		this.cardClass = 6;

		this.damage = Math.round(250 * (1 + currentGameState.year / 20));
		this.turns = Math.max(4, randomIntFromInterval(6, 10) - Math.floor(currentGameState.year / 15));
		this.shield = Math.min(
			this.turns - 1,
			Math.floor(randomIntFromInterval(2, 4) * (1 + currentGameState.year / 30))
		);
		this.health = 1;

		decorateCard(slot, data, this, getSVG(svgs.DEATH_STAR));
	}
}

class EarthCard extends Enemy {
	constructor(slot, data) {
		super();
		this.cardClass = 7;

		this.damage = Math.round(250 * (1 + currentGameState.year / 20));
		this.turns = Math.max(4, randomIntFromInterval(6, 10) - Math.floor(currentGameState.year / 15));
		this.shield = Math.min(
			this.turns - 1,
			Math.floor(randomIntFromInterval(2, 4) * (1 + currentGameState.year / 30))
		);
		this.health = 1;

		decorateCard(slot, data, this, getSVG(svgs.EARTH));
	}
}
// #endregion

const cards = [
	HealthCard, // 0
	ShieldCard, // 1
	DamageCard, // 2
	AsteroidCard, // 3
	PlanetCard, // 4
	AlienCard, // 5
	DeathStarCard, // 6
	EarthCard, // 7
];

const worlds = [
	{
		icon: svgs.MOON,
		maxYear: 15,
		year: 0,
		health: 30,
		shield: 0,
		damage: 1,
		cards: [null, null, null],
		cardTypes: [
			{
				chance: 50,
				card: 0,
			},
			{
				chance: 5,
				card: 1,
			},
			{
				chance: 10,
				card: 2,
			},
			{
				chance: 35,
				card: 3,
			},
		],
	},
	{
		icon: svgs.EARTH,
		maxYear: 30,
		year: 0,
		health: 50,
		shield: 1,
		damage: 2,
		cards: [null, null, null, null, null, null],
		cardTypes: [
			{
				chance: 50,
				card: 0,
			},
			{
				chance: 5,
				card: 1,
			},
			{
				chance: 10,
				card: 2,
			},
			{
				chance: 29,
				card: 3,
			},
			{
				chance: 5,
				card: 4,
			},
			{
				chance: 1,
				card: 5,
			},
		],
	},
	{
		icon: svgs.MARS,
		maxYear: 45,
		year: 0,
		health: 75,
		shield: 0,
		damage: 1,
		cards: [null, null, null, null, null, null],
		cardTypes: [
			{
				chance: 45,
				card: 0,
			},
			{
				chance: 5,
				card: 1,
			},
			{
				chance: 10,
				card: 2,
			},
			{
				chance: 25,
				card: 3,
			},
			{
				chance: 10,
				card: 4,
			},
			{
				chance: 3,
				card: 5,
			},
			{
				chance: 2,
				card: 7,
			},
		],
	},
	{
		icon: svgs.DEATH_STAR,
		maxYear: 60,
		year: 0,
		health: 100,
		shield: 1,
		damage: 2,
		cards: [null, null, null, null, null, null],
		cardTypes: [
			{
				chance: 45,
				card: 0,
			},
			{
				chance: 5,
				card: 1,
			},
			{
				chance: 10,
				card: 2,
			},
			{
				chance: 25,
				card: 3,
			},
			{
				chance: 10,
				card: 4,
			},
			{
				chance: 3,
				card: 5,
			},
			{
				chance: 2,
				card: 6,
			},
		],
	},
];

const updateLockIcons = () => {
	querySelectorAll(".lock", rootElement).forEach((lockElement) => {
		lockElement.remove();
	});
	querySelectorAll(".locked", rootElement).forEach((lockedElement) => {
		addContent(lockedElement, getSVG(svgs.LOCK));
	});
};

const showTutorial = (delay = 0) => {
	if (currentGameState.tutorialShown === false) {
		showPopup(
			`Tutorial!<p>Pick a card to either collect a power-up, or attack an enemy</p>`,
			[
				{
					content: "Thanks...",
					action: () => {
						currentGameState.tutorialShown = true;
						saveGame(currentGameState);
					},
				},
			],
			() => {}
		);
	}
};

const setup = () => {
	loadGame();

	if (currentGameState.soundOn !== null) {
		showTutorial();
	}

	initSound();

	initGameSpeed();

	initSocial();

	const backgroundMusicPlayer = zzfxP(...backgroundMusic);
	backgroundMusicPlayer.loop = true;

	initElements();

	setupWorld(currentGameState.world);

	updateLockIcons();

	if (currentGameState.gameEnded) {
		showWorldSelectScreen();
	}
};

(function () {
	setup();
})();

//# sourceMappingURL=main.js.map
