/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Ryan Jin, Alexander Mohler
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.FB_COLLECTION_REQUESTS = "Requests";
rhit.FB_COLLECTION_OFFERS = "Offers";
rhit.FB_COLLECTION_USERS = "Users";
rhit.fbAuthManager = null;
rhit.fbOffersManager = null;
rhit.fbRequestsManager = null;

// from: https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

//Class for making Request objects
rhit.Request = class {
	constructor(id, requester, startTime, endTime, payment, start, dest, comment) {
		this.id = id;
		this.requester = requester;
		this.startTime = startTime;
		this.endTime = endTime;
		this.payment = payment;
		this.start = start;
		this.dest = dest;
		this.comment = comment;
	}


}

//Class for making Offer objects
rhit.Offer = class {
	constructor(id, driver, startTime, endTime, price, start, dest, comment, seats) {
		this.id = id;
		this.driver = driver;
		this.startTime = startTime;
		this.endTime = endTime;
		this.price = price;
		this.start = start;
		this.dest = dest;
		this.comment = comment;
		this.seats = seats;
		this.riders = [];
	}
}

//----------------------------- Controllers -----------------------------
rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		}
	}
}

rhit.HomePageController = class {
	constructor() {
		// rhit.fbOffersManager.beginListening(this.updateList.bind(this));

		document.querySelector("#createRequestButton").onclick = (event) => {
			window.location.href = `/createRequest.html`
		}

		document.querySelector("#createOfferButton").onclick = (event) => {
			window.location.href = `/createOffer.html`
		}
	}

}

rhit.RequestsPageController = class {
	constructor() {
		rhit.fbRequestsManager.beginListening(this.updateList.bind(this));
	}
	//Had to add "async" and "await" because there was some concurrency error or something
	async _createCard(request) {
		//getting doc
		this._ref = await firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(request.requester).get()
		//getting data from doc
		const _requester = this._ref.data();
		this.tripInfo = "Drop-Off Only";
		this.returnTime = "";
		//this gets the Timestamp() from firebase and converts it to a formatted JS date.
		this.startTime = request.startTime.toDate().toLocaleDateString('en-us', {
			weekday: "long",
			month: "long",
			day: "numeric",
			hour: '2-digit',
			minute: '2-digit'
		});
		//If there's an end time then change the text and format the time.
		if (request.endTime) {
			this.tripInfo = "Round-Trip";
			this.endTime = request.endTime.toDate().toLocaleDateString('en-us', {
				weekday: "long",
				month: "long",
				day: "numeric",
				hour: '2-digit',
				minute: '2-digit'
			});
			//this will get added to the html element below the departure time.
			this.returnTime = `<h6 class="text-muted card-return">Return Time: ${this.endTime}</h6>`
		}
		return htmlToElement(`<div class="card">
			<div class="card-body">
			  <div class="align-items-center row">
				<img src="${_requester.profilePic}"
				  alt="Profile Picture" class="card-pfp">
				<h6 class="text-muted card-username">${_requester.displayName}'s Request</h6>
				<div class="ride-type">${this.tripInfo}</div>
			  </div>
			  <div class="card-locations">
				<h6 class="text-muted card-from">From: ${request.start}</h6>
				<h6 class="text-muted card-to">To: ${request.dest}</h6>
			  </div>
			  <div class="bottom-row row">
				<div class="card-times">
				  <h6 class="text-muted card-departure">Departure Time: ${this.startTime}</h6>
				  ${this.returnTime}
				</div>
				<div class="card-money row align-items-center">
				  <div class="pay-text">Pays&nbsp;</div>
				  <div class="card-value">$${request.payment}</div>
				</div>
			  </div>
			</div>`);
	}

	async updateList() {
		const newList = htmlToElement('<div class="list-container"></div>');
		for (let i = 0; i < rhit.fbRequestsManager.length; i++) {
			const request = rhit.fbRequestsManager.getRequestAtIndex(i);
			const newCard = await this._createCard(request);

			newCard.onclick = (event) => {

				window.location.href = `/requestDetails.html?id=${request.id}`;
			}

			newList.appendChild(newCard);
		}


		const oldList = document.querySelector(".list-container");
		oldList.removeAttribute("class");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}


}

rhit.OffersPageController = class {
	constructor() {
		rhit.fbOffersManager.beginListening(this.updateList.bind(this));
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data: ", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}

	async _createCard(offer) {
		this._ref = await firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(offer.driver).get()
		const _driver = this._ref.data();
		this.returnTime = "";
		this.startTime = offer.startTime.toDate().toLocaleDateString('en-us', {
			weekday: "long",
			month: "long",
			day: "numeric",
			hour: '2-digit',
			minute: '2-digit'
		});
		if (offer.endTime) {
			this.endTime = offer.endTime.toDate().toLocaleDateString('en-us', {
				weekday: "long",
				month: "long",
				day: "numeric",
				hour: '2-digit',
				minute: '2-digit'
			});
			this.returnTime = `<h6 class="text-muted card-return">Return Time: ${this.endTime}</h6>`
		}
		return htmlToElement(`<div class="card">
				<div class="card-body">
				  <div class="align-items-center row">
					<img src="${_driver.profilePic}"
					  alt="Profile Picture" class="card-pfp">
					<h6 class="text-muted card-username">${_driver.displayName}'s Ride</h6>
					<div class="card-seats-available">${offer.seats - offer.riders.length} seats available</div>
				  </div>
				  <div class="card-locations">
					<h6 class="text-muted card-from">From: ${offer.start}</h6>
					<h6 class="text-muted card-to">To: ${offer.dest}</h6>
				  </div>
				  <div class="bottom-row row">
					<div class="card-times">
					  <h6 class="text-muted card-departure">Departure Time: ${this.startTime}</h6>
					  ${this.returnTime}
					</div>
					<div class="card-money row align-items-center">
					  <div class="pay-text">Price:&nbsp;</div>
					  <div class="card-value">$${offer.price}</div>
					</div>
				  </div>
				</div>
			  </div>`);
	}

	async updateList() {
		const newList = htmlToElement('<div class="list-container"></div>');
		for (let i = 0; i < rhit.fbOffersManager.length; i++) {
			const offer = rhit.fbOffersManager.getOfferAtIndex(i);
			const newCard = await this._createCard(offer);

			newCard.onclick = (event) => {

				window.location.href = `/offerDetails.html?id=${offer.id}`;
			}

			newList.appendChild(newCard);
		}


		const oldList = document.querySelector(".list-container");
		oldList.removeAttribute("class");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
}

rhit.ProfilePageController = class {
	constructor() {
		rhit.fbOffersManager.beginListening(this.updateList.bind(this));
		rhit.fbRequestsManager.beginListening(this.updateList.bind(this));
		document.querySelector("#signOutButton").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}
	}

	async _createRequestCard(request) {
		//getting doc
		this._ref = await firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(request.requester).get()
		//getting data from doc
		const _requester = this._ref.data();
		this.tripInfo = "Drop-Off Only";
		this.returnTime = "";
		//this gets the Timestamp() from firebase and converts it to a formatted JS date.
		this.startTime = request.startTime.toDate().toLocaleDateString('en-us', {
			weekday: "long",
			month: "long",
			day: "numeric",
			hour: '2-digit',
			minute: '2-digit'
		});
		//If there's an end time then change the text and format the time.
		if (request.endTime) {
			this.tripInfo = "Round-Trip";
			this.endTime = request.endTime.toDate().toLocaleDateString('en-us', {
				weekday: "long",
				month: "long",
				day: "numeric",
				hour: '2-digit',
				minute: '2-digit'
			});
			//this will get added to the html element below the departure time.
			this.returnTime = `<h6 class="text-muted card-return">Return Time: ${this.endTime}</h6>`
		}
		return htmlToElement(`<div class="card">
			<div class="card-body">
			  <div class="align-items-center row">
				<img src="${_requester.profilePic}"
				  alt="Profile Picture" class="card-pfp">
				<h6 class="text-muted card-username">${_requester.displayName}'s Request</h6>
				<div class="ride-type">${this.tripInfo}</div>
			  </div>
			  <div class="card-locations">
				<h6 class="text-muted card-from">From: ${request.start}</h6>
				<h6 class="text-muted card-to">To: ${request.dest}</h6>
			  </div>
			  <div class="bottom-row row">
				<div class="card-times">
				  <h6 class="text-muted card-departure">Departure Time: ${this.startTime}</h6>
				  ${this.returnTime}
				</div>
				<div class="card-money row align-items-center">
				  <div class="pay-text">Pays&nbsp;</div>
				  <div class="card-value">$${request.payment}</div>
				</div>
			  </div>
			</div>`);
	}

	async _createOfferCard(offer) {
		this._ref = await firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(offer.driver).get()
		const _driver = this._ref.data();
		this.returnTime = "";
		this.startTime = offer.startTime.toDate().toLocaleDateString('en-us', {
			weekday: "long",
			month: "long",
			day: "numeric",
			hour: '2-digit',
			minute: '2-digit'
		});
		if (offer.endTime) {
			this.endTime = offer.endTime.toDate().toLocaleDateString('en-us', {
				weekday: "long",
				month: "long",
				day: "numeric",
				hour: '2-digit',
				minute: '2-digit'
			});
			this.returnTime = `<h6 class="text-muted card-return">Return Time: ${this.endTime}</h6>`
		}
		return htmlToElement(`<div class="card">
				<div class="card-body">
				  <div class="align-items-center row">
					<img src="${_driver.profilePic}"
					  alt="Profile Picture" class="card-pfp">
					<h6 class="text-muted card-username">${_driver.displayName}'s Ride</h6>
					<div class="card-seats-available">${offer.seats - offer.riders.length} seats available</div>
				  </div>
				  <div class="card-locations">
					<h6 class="text-muted card-from">From: ${offer.start}</h6>
					<h6 class="text-muted card-to">To: ${offer.dest}</h6>
				  </div>
				  <div class="bottom-row row">
					<div class="card-times">
					  <h6 class="text-muted card-departure">Departure Time: ${this.startTime}</h6>
					  ${this.returnTime}
					</div>
					<div class="card-money row align-items-center">
					  <div class="pay-text">Price:&nbsp;</div>
					  <div class="card-value">$${offer.price}</div>
					</div>
				  </div>
				</div>
			  </div>`);
	}

	async updateList() {
		const newList = htmlToElement('<div class="list-container"></div>');
		for (let i = 0; i < rhit.fbRequestsManager.length; i++) {
			const request = rhit.fbRequestsManager.getRequestAtIndex(i);
			const newCard = await this._createRequestCard(request);

			newCard.onclick = (event) => {

				window.location.href = `/requestDetails.html?id=${request.id}`;
			}

			newList.appendChild(newCard);
		}
		for (let i = 0; i < rhit.fbOffersManager.length; i++) {
			const offer = rhit.fbOffersManager.getOfferAtIndex(i);
			const newCard = await this._createOfferCard(offer);

			newCard.onclick = (event) => {

				window.location.href = `/offerDetails.html?id=${offer.id}`;
			}

			newList.appendChild(newCard);
		}



		const oldList = document.querySelector(".list-container");
		oldList.removeAttribute("class");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}

}

rhit.CreateRequestPageController = class {
	constructor() {
		document.querySelector("#roundTripCheck").onclick = (event) => {
			if (document.querySelector("#roundTripCheck").checked) {
				document.querySelector(".hide-on-click").style.display = "block";
			} else {
				document.querySelector(".hide-on-click").style.display = "none";
			}
		}
	}
}



//----------------------------- Managers -----------------------------
rhit.FbRequestsManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_REQUESTS);
		this._unsubscribe = null;
	}
	add(requester, startTime, endTime, payment, start, dest, comment) {
		this._ref.add({
				["requester"]: requester,
				["startTime"]: startTime,
				["endTime"]: endTime,
				["payment"]: payment,
				["start"]: start,
				["dest"]: dest,
				["comment"]: comment,

			})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}
	beginListening(changeListener) {
		//Closest start time is at the top. We still need to implement the auto-delete of documents that are outdated.
		let query = this._ref.orderBy("startTime", "asc").limit(50);
		if (this._uid) {
			query = query.where("requester", "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	}
	getRequestAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const request = new rhit.Request(docSnapshot.id,
			docSnapshot.get("requester"),
			docSnapshot.get("startTime"),
			docSnapshot.get("endTime"),
			docSnapshot.get("payment"),
			docSnapshot.get("start"),
			docSnapshot.get("dest"),
			docSnapshot.get("comment"),
		);
		return request;
	}
}

rhit.FbOffersManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_OFFERS);
		this._unsubscribe = null;
	}
	add(driver, startTime, endTime, price, start, dest, comment, seats, riders, ) {
		this._ref.add({
				["driver"]: driver,
				["startTime"]: startTime,
				["endTime"]: endTime,
				["price"]: price,
				["start"]: start,
				["dest"]: dest,
				["comment"]: comment,
				["seats"]: seats,
				["riders"]: riders,

			})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}
	beginListening(changeListener) {
		let query = this._ref.orderBy("startTime", "asc").limit(50);
		if (this._uid) {
			query = query.where("driver", "==", this._uid);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	}
	getOfferAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const offer = new rhit.Offer(docSnapshot.id,
			docSnapshot.get("driver"),
			docSnapshot.get("startTime"),
			docSnapshot.get("endTime"),
			docSnapshot.get("price"),
			docSnapshot.get("start"),
			docSnapshot.get("dest"),
			docSnapshot.get("comment"),
			docSnapshot.get("seats"),
			docSnapshot.get("riders"),
		);
		return offer;
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {
		Rosefire.signIn("f19089c3-ba70-4635-aae5-fced7a139f0f", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('the token you provided is not valid.');
				} else {
					console.error("Custom auth error", errorCode, errorMessage);
				}
			});
		});

	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#loginPage")) {
		console.log("login page");
		new rhit.LoginPageController();
	}
	if (document.querySelector("#mainPage")) {
		console.log("home page");
		new rhit.HomePageController();
	}

	if (document.querySelector("#profilePage")) {
		console.log("profile page");
		const uid = urlParams.get("uid");
		rhit.fbRequestsManager = new rhit.FbRequestsManager(uid);
		rhit.fbOffersManager = new rhit.FbOffersManager(uid);
		new rhit.ProfilePageController();
	}
	if (document.querySelector("#requestsPage")) {
		console.log("requests page");
		rhit.fbRequestsManager = new rhit.FbRequestsManager();
		new rhit.RequestsPageController();
	}

	if (document.querySelector("#createRequestPage")) {
		console.log("create requests page");
		rhit.fbRequestsManager = new rhit.FbRequestsManager();
		new rhit.CreateRequestPageController();
	}

	if (document.querySelector("#offersPage")) {
		console.log("offers page");
		rhit.fbOffersManager = new rhit.FbOffersManager();
		new rhit.OffersPageController();
	}
};

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/home.html";
	}

	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}
};


/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("auth change callback fired. TODO: check for redirects and init the page");
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);

		rhit.checkForRedirects();

		rhit.initializePage();
	});
};

rhit.main();