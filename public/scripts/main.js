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
rhit.fbUsersManager = null;
rhit.fbRequestsManager = null;
rhit.fbSingleRequestManager = null;
rhit.fbSingleOfferManager = null;
rhit.fbSingleUserManager = null;

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
	constructor(id, driver, startTime, endTime, price, start, dest, comment, seats, riders) {
		this.id = id;
		this.driver = driver;
		this.startTime = startTime;
		this.endTime = endTime;
		this.price = price;
		this.start = start;
		this.dest = dest;
		this.comment = comment;
		this.seats = seats;
		this.riders = riders;
	}
}

//Class for displaying riders on offer detail page
rhit.Rider = class {
	constructor(id, displayName, profilePic, phoneNumber, car = "", carSeats, cashAppTag, venmoTag) {
		this.id = id;
		this.displayName = displayName;
		this.profilePic = profilePic;
		this.phoneNumber = phoneNumber;
		this.car = car;
		this.carSeats = carSeats;
		this.cashAppTag = cashAppTag;
		this.venmoTag = venmoTag;
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

	// beginListening(changeListener) {
	// 	this._unsubscribe = this._ref.onSnapshot((doc) => {
	// 		if (doc.exists) {
	// 			console.log("Document data: ", doc.data());
	// 			this._documentSnapshot = doc;
	// 			changeListener();
	// 		} else {
	// 			console.log("No such document!");
	// 		}
	// 	});
	// }

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

rhit.OfferDetailPageController = class {
	constructor() {
		rhit.fbSingleOfferManager.beginListening(this.updateView.bind(this));
		rhit.fbUsersManager.beginListening(this.updateList.bind(this));
	}

	async updateList() {
		document.querySelector("#riderList").innerHTML = "";
		for (const riderID of rhit.fbSingleOfferManager.riders) {
			const rider = await rhit.fbUsersManager.getUserByID(riderID);
			document.querySelector("#riderList").appendChild(this._createRider(rider));
		}
	}

	_createRider(rider) {
		return htmlToElement(`<div class="rider row">
		<img src="${rider.profilePic}"
	  alt="Profile Picture" class="rider-pfp">
		<div class="rider-name">${rider.displayName}</div>
	  </div>`);
	}

	async updateView() {
		if (rhit.fbSingleOfferManager.driver == rhit.fbAuthManager.uid) {
			document.querySelector("#detailDropdown").style.display = "block";
			document.querySelector("#editButton").onclick = (event) => {
				window.location.href = `/createOffer.html?id=${rhit.fbSingleOfferManager.id}`
			}
			const button = document.querySelector("#detailActionButton");
			button.innerHTML = "Cancel Offer";
			button.onclick = (event) => {
				rhit.fbSingleOfferManager.delete().then(() => {
					console.log("Document successfully deleted!");
					window.location.href = "/home.html";
				}).catch((error) => {
					console.error("Error removing document: ", error);
				});;
			}
		} else {
			const button = document.querySelector("#detailActionButton");
			button.innerHTML = "Join Ride";
			button.onclick = (event) => {
				//add cur user as rider
			}
		}
		this._ref = await firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbSingleOfferManager.driver).get()
		const _driver = this._ref.data();
		document.querySelector(".detail-username").innerHTML = `${_driver.displayName} is offering a ride!`;
		document.querySelector(".detail-pfp").src = _driver.profilePic;
		document.querySelector(".detail-from").innerHTML = `From: ${rhit.fbSingleOfferManager.start}`;
		document.querySelector(".detail-to").innerHTML = `To: ${rhit.fbSingleOfferManager.dest}`;
		document.querySelector(".detail-departure").innerHTML = `Departure Time: ${rhit.fbSingleOfferManager.startTime.toDate().toLocaleDateString('en-us', {
				weekday: "long",
				month: "long",
				day: "numeric",
				hour: '2-digit',
				minute: '2-digit'
			})}`;
		if (rhit.fbSingleOfferManager.endTime) {
			document.querySelector(".detail-return").innerHTML = `Return Time: ${rhit.fbSingleOfferManager.endTime.toDate().toLocaleDateString('en-us', {
					weekday: "long",
					month: "long",
					day: "numeric",
					hour: '2-digit',
					minute: '2-digit'
				})}`;
		}
		document.querySelector(".detail-value").innerHTML = `$${rhit.fbSingleOfferManager.price}`;
	};
}

rhit.ProfilePageController = class {
	constructor() {
		rhit.fbOffersManager.beginListening(this.updateList.bind(this));
		rhit.fbRequestsManager.beginListening(this.updateList.bind(this));
		document.querySelector("#profileEditButton").onclick = (event) => {
			window.location.href = `/profileSetup.html?id=${rhit.fbAuthManager.uid}`;
		}
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

rhit.ProfileEditPageController = class {
	constructor(userID) {
		if (!rhit.fbSingleUserManager.id) {
			document.querySelector("#submitButton").onclick = (event) => {
				console.log("you tried submitting");
				if (document.querySelector("#displayName").value == "" || document.querySelector("#phoneNumber").value == "") {
					document.querySelector("#validationText").hidden = false;
				} else {
					const displayName = document.querySelector("#displayName").value;
					const myPicture = document.querySelector("#myPicture").src;
					const phoneNumber = document.querySelector("#phoneNumber").value;
					const carModel = document.querySelector("#carModel").value;
					const numSeats = document.querySelector("#numSeats").value;
					const cashAppTag = document.querySelector("#cashAppTag").value;
					const venmoTag = document.querySelector("#venmoTag").value;
					rhit.fbUsersManager.add(displayName, myPicture, phoneNumber, carModel, numSeats, cashAppTag, venmoTag);
				}
			};
		} else {
			rhit.fbSingleUserManager.beginListening(() => {
				document.querySelector("#displayName").value = rhit.fbSingleUserManager.displayName;
				document.querySelector("#venmoTag").value = rhit.fbSingleUserManager.venmoTag;
				document.querySelector("#cashAppTag").value = rhit.fbSingleUserManager.cashAppTag;
				document.querySelector("#myPicture").src = rhit.fbSingleUserManager.profilePic;
				document.querySelector("#phoneNumber").value = rhit.fbSingleUserManager.phoneNumber;
				document.querySelector("#carModel").value = rhit.fbSingleUserManager.car;
				document.querySelector("#numSeats").value = rhit.fbSingleUserManager.carSeats;
			});
			document.querySelector("#submitButton").onclick = (event) => {
				console.log("you tried submitting");
				if (document.querySelector("#displayName").value == "" || document.querySelector("#phoneNumber").value == "") {
					document.querySelector("#validationText").hidden = false;
				} else {
					const displayName = document.querySelector("#displayName").value;
					const myPicture = document.querySelector("#myPicture").src;
					const phoneNumber = document.querySelector("#phoneNumber").value;
					const carModel = document.querySelector("#carModel").value;
					const numSeats = document.querySelector("#numSeats").value;
					const cashAppTag = document.querySelector("#cashAppTag").value;
					const venmoTag = document.querySelector("#venmoTag").value;
					rhit.fbSingleUserManager.update(displayName, myPicture, phoneNumber, carModel, numSeats, cashAppTag, venmoTag);
				}
			};
		}
	}
}

rhit.CreateRequestPageController = class {
	constructor(reqId) {
		if (reqId) {
			rhit.fbSingleRequestManager.beginListening(() => {
				document.querySelector("#startingLocation").value = rhit.fbSingleRequestManager.start;
				document.querySelector("#destinationLocation").value = rhit.fbSingleRequestManager.dest;
				document.querySelector("#startTime").value = moment(rhit.fbSingleRequestManager.startTime.toDate()).format('YYYY-MM-DDTHH:mm:ss');
				if (rhit.fbSingleRequestManager.endTime) {
					document.querySelector("#roundTripCheck").checked = true;
					document.querySelector(".hide-on-click").style.display = "block";
					document.querySelector("#returnTime").disabled = false;
					document.querySelector("#returnTime").value = moment(rhit.fbSingleRequestManager.endTime.toDate()).format('YYYY-MM-DDTHH:mm:ss');
				}
				document.querySelector("#moneyInput").value = rhit.fbSingleRequestManager.payment;
				document.querySelector("#additionalComments").value = rhit.fbSingleRequestManager.comment;
			});
			console.log(rhit.fbSingleRequestManager);

			document.querySelector("#submitButton").onclick = (event) => {
				const startTime = new Date(document.querySelector("#startTime").value);
				let endTime = null;
				if (document.querySelector("#roundTripCheck").checked) {
					endTime = new Date(document.querySelector("#returnTime").value);
				}
				const payment = parseInt(document.querySelector("#moneyInput").value);
				const start = document.querySelector("#startingLocation").value;
				const dest = document.querySelector("#destinationLocation").value;
				const comment = document.querySelector("#additionalComments").value;
				rhit.fbSingleRequestManager.update(startTime, endTime, payment, start, dest, comment);
			}
		} else {
			document.querySelector("#submitButton").onclick = (event) => {
				const requester = rhit.fbAuthManager.uid;
				const startTime = new Date(document.querySelector("#startTime").value);
				let endTime = null;
				if (document.querySelector("#roundTripCheck").checked) {
					endTime = new Date(document.querySelector("#returnTime").value);
				}
				const payment = parseInt(document.querySelector("#moneyInput").value);
				const start = document.querySelector("#startingLocation").value;
				const dest = document.querySelector("#destinationLocation").value;
				const comment = document.querySelector("#additionalComments").value;
				rhit.fbRequestsManager.add(requester, startTime, endTime, payment, start, dest, comment);
			}
		}
		document.querySelector("#roundTripCheck").onclick = (event) => {
			if (document.querySelector("#roundTripCheck").checked) {
				document.querySelector(".hide-on-click").style.display = "block";
				document.querySelector("#returnTime").disabled = false;
			} else {
				document.querySelector(".hide-on-click").style.display = "none";
				document.querySelector("#returnTime").disabled = true;
			}
		}
		const startingLocationInput = document.getElementById("startingLocation");
		const destinationLocationInput = document.getElementById("destinationLocation");

		startingLocationInput.addEventListener("blur", () => addMarkerFromForm("startingLocation"));
		destinationLocationInput.addEventListener("blur", () => addMarkerFromForm("destinationLocation"));
	}
}

rhit.CreateOfferPageController = class {
	constructor(offerId) {
		if (offerId) {
			rhit.fbSingleOfferManager.beginListening(() => {
				document.querySelector("#startingLocation").value = rhit.fbSingleOfferManager.start;
				document.querySelector("#destinationLocation").value = rhit.fbSingleOfferManager.dest;
				document.querySelector("#startTime").value = moment(rhit.fbSingleOfferManager.startTime.toDate()).format('YYYY-MM-DDTHH:mm:ss');
				if (rhit.fbSingleOfferManager.endTime) {
					document.querySelector("#roundTripCheck").checked = true;
					document.querySelector(".hide-on-click").style.display = "block";
					document.querySelector("#returnTime").disabled = false;
					document.querySelector("#returnTime").value = moment(rhit.fbSingleOfferManager.endTime.toDate()).format('YYYY-MM-DDTHH:mm:ss');
				}
				document.querySelector("#moneyInput").value = rhit.fbSingleOfferManager.price;
				document.querySelector("#additionalComments").value = rhit.fbSingleOfferManager.comment;
			});
			console.log(rhit.fbSingleOfferManager);

			document.querySelector("#submitButton").onclick = (event) => {
				const startTime = new Date(document.querySelector("#startTime").value);
				let endTime = null;
				if (document.querySelector("#roundTripCheck").checked) {
					endTime = new Date(document.querySelector("#returnTime").value);
				}
				const price = parseInt(document.querySelector("#moneyInput").value);
				const start = document.querySelector("#startingLocation").value;
				const dest = document.querySelector("#destinationLocation").value;
				const comment = document.querySelector("#additionalComments").value;
				const seats = 5; // placeholder values
				rhit.fbSingleOfferManager.update(startTime, endTime, price, start, dest, comment, seats, rhit.fbSingleOfferManager.riders);
			}
		} else {
			document.querySelector("#submitButton").onclick = (event) => {
				const driver = rhit.fbAuthManager.uid;
				const startTime = new Date(document.querySelector("#startTime").value);
				let endTime = null;
				if (document.querySelector("#roundTripCheck").checked) {
					endTime = new Date(document.querySelector("#returnTime").value);
				}
				const price = parseInt(document.querySelector("#moneyInput").value);
				const start = document.querySelector("#startingLocation").value;
				const dest = document.querySelector("#destinationLocation").value;
				const comment = document.querySelector("#additionalComments").value;
				const seats = parseInt(document.querySelector("#seatsInput").value); // placeholder values
				const riders = 0;
				rhit.fbOffersManager.add(driver, startTime, endTime, price, start, dest, comment, seats);
			}
		}
		document.querySelector("#roundTripCheck").onclick = (event) => {
			if (document.querySelector("#roundTripCheck").checked) {
				document.querySelector(".hide-on-click").style.display = "block";
				document.querySelector("#returnTime").disabled = false;
			} else {
				document.querySelector(".hide-on-click").style.display = "none";
				document.querySelector("#returnTime").disabled = true;
			}
		}
		const startingLocationInput = document.getElementById("startingLocation");
		const destinationLocationInput = document.getElementById("destinationLocation");

		startingLocationInput.addEventListener("blur", () => addMarkerFromForm("startingLocation"));
		destinationLocationInput.addEventListener("blur", () => addMarkerFromForm("destinationLocation"));
	}
}

rhit.RequestDetailPageController = class {
	constructor() {
		rhit.fbSingleRequestManager.beginListening(this.updateView.bind(this));

	}

	async updateView() {
		if (rhit.fbSingleRequestManager.requester == rhit.fbAuthManager.uid) {
			document.querySelector("#detailDropdown").style.display = "block";
			document.querySelector("#editButton").onclick = (event) => {
				window.location.href = `/createRequest.html?id=${rhit.fbSingleRequestManager.id}`
			}
			const button = document.querySelector("#detailActionButton");
			button.innerHTML = "Cancel Request";
			button.onclick = (event) => {
				rhit.fbSingleRequestManager.delete().then(() => {
					console.log("Document successfully deleted!");
					window.location.href = "/home.html";
				}).catch((error) => {
					console.error("Error removing document: ", error);
				});;
			}
		} else {
			const button = document.querySelector("#detailActionButton");
			button.innerHTML = "Offer Ride";
			button.onclick = (event) => {
				const driver = rhit.fbAuthManager.uid;
				const startTime = rhit.fbSingleRequestManager.startTime;
				const endTime = rhit.fbSingleRequestManager.endTime;
				const price = rhit.fbSingleRequestManager.payment;
				const start = rhit.fbSingleRequestManager.start;
				const dest = rhit.fbSingleRequestManager.dest;
				const comment = ""; // figure out later
				const seats = 5; //figure out later
				const riders = [rhit.fbSingleRequestManager.requester];
				console.log(driver, startTime, endTime, price, start, dest, riders);
				rhit.fbOffersManager.add(driver, startTime, endTime, price, start, dest, comment, seats, riders);
				rhit.fbSingleRequestManager.delete().then(() => {
					console.log("Document successfully deleted!");
				}).catch((error) => {
					console.error("Error removing document: ", error);
				});
			}
		}
		this._ref = await firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbSingleRequestManager.requester).get()
		const _requester = this._ref.data();
		document.querySelector(".detail-username").innerHTML = `${_requester.displayName} is requesting a ride!`;
		document.querySelector(".detail-pfp").src = _requester.profilePic;
		document.querySelector(".detail-from").innerHTML = `From: ${rhit.fbSingleRequestManager.start}`;
		document.querySelector(".detail-to").innerHTML = `To: ${rhit.fbSingleRequestManager.dest}`;
		document.querySelector(".detail-departure").innerHTML = `Departure Time: ${rhit.fbSingleRequestManager.startTime.toDate().toLocaleDateString('en-us', {
				weekday: "long",
				month: "long",
				day: "numeric",
				hour: '2-digit',
				minute: '2-digit'
			})}`;
		if (rhit.fbSingleRequestManager.endTime) {
			document.querySelector(".detail-return").innerHTML = `Return Time: ${rhit.fbSingleRequestManager.endTime.toDate().toLocaleDateString('en-us', {
					weekday: "long",
					month: "long",
					day: "numeric",
					hour: '2-digit',
					minute: '2-digit'
				})}`;
		}
		document.querySelector(".detail-value").innerHTML = `$${rhit.fbSingleRequestManager.payment}`;
	};
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
				window.location.href = `/requestDetails.html?id=${docRef.id}`
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

rhit.FbUsersManager = class {
	constructor() {
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._unsubscribe = null;
		this._uid = rhit.fbAuthManager.uid;
	}
	beginListening(changeListener) {
		let query = this._ref.limit(100);
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}

	add(displayName, profilePic, phoneNumber, car, carSeats, cashAppTag = "", venmoTag = "") {
		this._ref.doc(this._uid).set({
				["displayName"]: displayName,
				["profilePic"]: profilePic,
				["phoneNumber"]: phoneNumber,
				["car"]: car,
				["seats"]: carSeats,
				["cashAppTag"]: cashAppTag,
				["venmoTag"]: venmoTag,
			})
			.then(() => {
				console.log("Document successfully created");
				window.location.href = `/profile.html?id=${this._uid}`
			})
			.catch(function (error) {
				console.log("Error updating document: ", error);
			});
	}
	stopListening() {
		this._unsubscribe();
	}
	get length() {
		return this._documentSnapshots.length;
	}
	async getUserByID(id) {
		let targetUser = null;
		let userDoc = null;
		let rider = null;

		for (const docSnapshot of this._documentSnapshots) {
			const docData = docSnapshot.data();
			if (docSnapshot.id === id) {
				targetUser = docData;
				userDoc = docSnapshot;
				break;
			}
		}
		if (!targetUser) {
			return null;
		}
		rider = new rhit.Rider(id,
			targetUser.displayName,
			targetUser.profilePic
		);
		return rider;
	}
}

rhit.FbSingleUserManager = class {
	constructor(userID) {
		this._id = userID;
		this._documentSnapshot = {};
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(userID);
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

	update(displayName, profilePic, phoneNumber, car, carSeats, cashAppTag = "", venmoTag = "") {
		this._ref.update({
				["displayName"]: displayName,
				["profilePic"]: profilePic,
				["phoneNumber"]: phoneNumber,
				["car"]: car,
				["seats"]: carSeats,
				["cashAppTag"]: cashAppTag,
				["venmoTag"]: venmoTag,
			})
			.then(() => {
				console.log("Document successfully updated");
				window.location.href = `/profile.html?id=${this._id}`
			})
			.catch(function (error) {
				console.log("Error updating document: ", error);
			});
	}

	delete() {
		return this._ref.delete();
	}

	get id() {
		return this._id;
	}

	get displayName() {
		return this._documentSnapshot.get("displayName");
	}

	get profilePic() {
		return this._documentSnapshot.get("profilePic");
	}

	get phoneNumber() {
		return this._documentSnapshot.get("phoneNumber");
	}

	get car() {
		return this._documentSnapshot.get("car");
	}

	get carSeats() {
		return this._documentSnapshot.get("seats");
	}

	get cashAppTag() {
		return this._documentSnapshot.get("cashAppTag");
	}

	get venmoTag() {
		return this._documentSnapshot.get("venmoTag");
	}
}

rhit.FbSingleRequestManager = class {
	constructor(requestId) {
		this._id = requestId;
		this._documentSnapshot = {};
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_REQUESTS).doc(requestId);
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

	update(startTime, endTime, payment, start, dest, comment) {
		this._ref.update({
				["startTime"]: startTime,
				["endTime"]: endTime,
				["payment"]: payment,
				["start"]: start,
				["dest"]: dest,
				["comment"]: comment,
			})
			.then(() => {
				console.log("Document successfully updated");
				window.location.href = `/requestDetails.html?id=${this._id}`
			})
			.catch(function (error) {
				console.log("Error updating document: ", error);
			});
	}

	delete() {
		return this._ref.delete();
	}

	get id() {
		return this._id;
	}

	get requester() {
		return this._documentSnapshot.get("requester");
	}
	get start() {
		return this._documentSnapshot.get("start");
	}
	get dest() {
		return this._documentSnapshot.get("dest");
	}
	get comment() {
		return this._documentSnapshot.get("comment");
	}
	get startTime() {
		return this._documentSnapshot.get("startTime");
	}
	get endTime() {
		return this._documentSnapshot.get("endTime");
	}
	get payment() {
		return this._documentSnapshot.get("payment");
	}
}

rhit.FbOffersManager = class {
	constructor(uid, limit = 50) {
		this._uid = uid;
		this._limit = limit;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_OFFERS);
		this._unsubscribe = null;
	}
	add(driver, startTime, endTime, price, start, dest, comment, seats, riders = []) {
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
				window.location.href = `/offerDetails.html?id=${docRef.id}`
			})
			.catch(function (error) {
				console.error("Error adding document: ", error);
			});
	}
	beginListening(changeListener) {
		let query = this._ref.orderBy("startTime", "asc").limit(this._limit);
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

rhit.FbSingleOfferManager = class {
	constructor(offerId) {
		this._id = offerId;
		this._documentSnapshot = {};
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_OFFERS).doc(offerId);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data: ", doc.data());
				console.log("its working");
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		});
	}

	update(startTime, endTime, price, start, dest, comment, seats, riders) {
		this._ref.update({
				["startTime"]: startTime,
				["endTime"]: endTime,
				["price"]: price,
				["start"]: start,
				["dest"]: dest,
				["comment"]: comment,
				["seats"]: seats,
				["riders"]: riders,
			})
			.then(() => {
				console.log("Document successfully updated");
				window.location.href = `/offerDetails.html?id=${this._id}`
			})
			.catch(function (error) {
				console.log("Error updating document: ", error);
			});
	}

	delete() {
		return this._ref.delete();
	}

	get id() {
		return this._id;
	}

	get driver() {
		return this._documentSnapshot.get("driver");
	}
	get start() {
		return this._documentSnapshot.get("start");
	}
	get dest() {
		return this._documentSnapshot.get("dest");
	}
	get comment() {
		return this._documentSnapshot.get("comment");
	}
	get startTime() {
		return this._documentSnapshot.get("startTime");
	}
	get endTime() {
		return this._documentSnapshot.get("endTime");
	}
	get price() {
		return this._documentSnapshot.get("price");
	}
	get riders() {
		return this._documentSnapshot.get("riders");
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			//im pretty sure this is really inefficient cause it seems to run every time i change the page, but this is the only way I can get new users' documents to show up.
			// if (user) {
			// 	const userRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(user.uid);
			// 	userRef.get().then((doc) => {
			// 		if (!doc.exists) {
			// 			// User document doesn't exist, create a new user document
			// 			userRef.set({
			// 				displayName: user.displayName,
			// 				// Add other user properties as needed
			// 			}).then(() => {
			// 				console.log("New user document created!");
			// 			}).catch((error) => {
			// 				console.error("Error creating user document:", error);
			// 			});
			// 		} else {
			// 			console.log("user already exists.");
			// 		}
			// 	}).catch((error) => {
			// 		console.error("Error checking user document:", error);
			// 	});
			// }
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
	const profileButtons = document.querySelectorAll(".profile-button");
	profileButtons.forEach(link => link.href += `?id=${rhit.fbAuthManager.uid}`);

	if (document.querySelector("#loginPage")) {
		console.log("login page");
		new rhit.LoginPageController();
	}
	if (document.querySelector("#mainPage")) {
		console.log("home page");
		new rhit.HomePageController();
		rhit.fbOffersManager = new rhit.FbOffersManager(null, 5);
		new rhit.OffersPageController();
	}

	if (document.querySelector("#profilePage")) {
		console.log("profile page");
		const uid = urlParams.get("id");
		rhit.fbRequestsManager = new rhit.FbRequestsManager(uid);
		rhit.fbOffersManager = new rhit.FbOffersManager(uid);
		new rhit.ProfilePageController();
	}

	if (document.querySelector("#profileBody")) {
		console.log("profile setup page");
		const uid = urlParams.get("id");
		rhit.fbSingleUserManager = new rhit.FbSingleUserManager(uid);
		new rhit.ProfileEditPageController();
	}

	if (document.querySelector("#requestsPage")) {
		console.log("requests page");
		rhit.fbRequestsManager = new rhit.FbRequestsManager();
		new rhit.RequestsPageController();
	}

	if (document.querySelector("#requestDetailPage")) {
		console.log("requests detail page");
		const reqId = urlParams.get("id");
		rhit.fbOffersManager = new rhit.FbOffersManager();
		rhit.fbSingleRequestManager = new rhit.FbSingleRequestManager(reqId);
		new rhit.RequestDetailPageController();
	}

	if (document.querySelector("#offerDetailPage")) {
		console.log("offer detail page");
		const offerId = urlParams.get("id");
		rhit.fbSingleOfferManager = new rhit.FbSingleOfferManager(offerId);
		new rhit.OfferDetailPageController();
	}

	if (document.querySelector("#createRequestPage")) {
		console.log("create requests page");
		const reqId = urlParams.get("id");
		rhit.fbRequestsManager = new rhit.FbRequestsManager();
		if (reqId) {
			rhit.fbSingleRequestManager = new rhit.FbSingleRequestManager(reqId);
		}
		new rhit.CreateRequestPageController(reqId);
	}

	if (document.querySelector("#createOfferPage")) {
		console.log("create offers page");
		const offerId = urlParams.get("id");
		rhit.fbOffersManager = new rhit.FbOffersManager();
		if (offerId) {
			rhit.fbSingleOfferManager = new rhit.FbSingleOfferManager(offerId);
		}
		new rhit.CreateOfferPageController(offerId);
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

	//check if user displayName exist; otherwise redirect to profile edit page where they must put it in.
	if (!document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn && !document.querySelector("#profileBody")) {
		// rhit.fbUsersManager.beginListening(() => {
		// 	rhit.fbUsersManager.getUserByID(rhit.fbAuthManager.uid).then((user) => {
		// 		if (!user.displayName) {
		// 			window.location.href = "/profileSetup.html";
		// 		} else {
		// 			rhit.fbUsersManager.stopListening();
		// 		}
		// 	});
		// });

		if (!rhit.fbUsersManager.getUserByID(rhit.fbAuthManager.uid)) {
			window.location.href = "/profileSetup.html";
		}
	}

	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/";
	}


};
//----------------------------- Profile Picture Upload -----------------------------
//Mostly rough test code that I will move later into a controller and manager
window.addEventListener('load', function () {
	document.querySelector('input[type="file"]').addEventListener('change', function () {
		if (this.files && this.files[0]) {
			var img = document.querySelector('img');
			img.onload = () => {
				URL.revokeObjectURL(img.src); // no longer needed, free memory
			}

			img.src = URL.createObjectURL(this.files[0]); // set src to blob url

			//write code here to set the firebase database information
		}
	});
});



//----------------------------- Google Maps API -----------------------------
let map;
let markers = [];
let directionsService;
let directionsRenderer;

// const startingLocationInput = document.getElementById("startingLocation");
// const destinationLocationInput = document.getElementById("destinationLocation");

// startingLocationInput.addEventListener("blur", () => addMarkerFromForm("startingLocation"));
// destinationLocationInput.addEventListener("blur", () => addMarkerFromForm("destinationLocation"));

function initMap() {
	map = new google.maps.Map(document.getElementById("map"), {
		mapId: "6cd56b6d055b9278",
		center: {
			lat: 39.4827,
			lng: -87.3240
		},
		zoom: 15,
	});

	directionsService = new google.maps.DirectionsService();
	directionsRenderer = new google.maps.DirectionsRenderer();
	directionsRenderer.setMap(map);

	// Enable Places API Autocomplete on starting and destination input fields
	const startingLocationInput = document.getElementById("startingLocation");
	const destinationLocationInput = document.getElementById("destinationLocation");

	const autocompleteOptions = {
		types: ["geocode"],
	};

	const startingLocationAutocomplete = new google.maps.places.Autocomplete(
		startingLocationInput,
		autocompleteOptions
	);

	const destinationLocationAutocomplete = new google.maps.places.Autocomplete(
		destinationLocationInput,
		autocompleteOptions
	);

	// Add event listeners for place_changed event on Autocomplete
	//The place_changed event means you clicked something from the autocomplete dropdown
	startingLocationAutocomplete.addListener("place_changed", () => {
		const place = startingLocationAutocomplete.getPlace();
		if (place.geometry) {
			addMarkerFromAutocomplete(place);
		}
	});

	destinationLocationAutocomplete.addListener("place_changed", () => {
		const place = destinationLocationAutocomplete.getPlace();
		if (place.geometry) {
			addMarkerFromAutocomplete(place);
		}
	});
}

function addMarkerFromForm(inputId) {
	const input = document.getElementById(inputId).value;
	geocodeAddress(input);
}

//in the case of autocomplete, there's no need to read from the html IDs (startingLocation and 
//destinationLocation because the getPlace() method takes care of that
function addMarkerFromAutocomplete(place) {
	console.log(place);
	geocodeAddress(place);
}

function geocodeAddress(location) {
	const geocoder = new google.maps.Geocoder();
	geocoder.geocode({
		address: location
	}, (results, status) => {
		if (status === "OK") {
			const latitude = results[0].geometry.location.lat();
			const longitude = results[0].geometry.location.lng();
			const latLng = {
				lat: latitude,
				lng: longitude
			};
			addMarker(latLng);
		} else {
			console.log("Geocode was not successful for the following reason: " + status);
			return;
		}
	});
}

function addMarker(latLng) {
	const marker = new google.maps.Marker({
		position: latLng,
		map: map,
	});
	markers.push(marker);

	// Create a LatLngBounds object to encompass all markers
	const bounds = new google.maps.LatLngBounds();
	for (const marker of markers) {
		bounds.extend(marker.getPosition());
	}
	map.setZoom(15);

	// Fit the map's viewport to the bounds of all markers
	map.fitBounds(bounds);

	if (markers.length === 1) {
		map.setZoom(17);
	}

	// Check if both starting point and destination markers are present
	if (markers.length === 2) {
		calculateAndDisplayRoute();
	}
}

function calculateAndDisplayRoute() {
	const startMarker = markers[0];
	const destinationMarker = markers[1];

	const request = {
		origin: startMarker.getPosition(),
		destination: destinationMarker.getPosition(),
		travelMode: google.maps.TravelMode.DRIVING,
	};

	// Call the Directions Service to get the route
	directionsService.route(request, (result, status) => {
		if (status === "OK") {
			// Display the route on the map using Directions Renderer
			directionsRenderer.setDirections(result);
		} else {
			console.log("Directions request failed due to " + status);
		}
	});
	//Potential TODO: When another address is input (when the form is changed), a third marker is created, maybe figure out a way to remove current 
	//markers when the address is changed so there are only two markers in the array
}


window.initMap = initMap;





/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	rhit.fbAuthManager = new rhit.FbAuthManager();
	// rhit.fbAuthManager.beginListening(() => {
	// 	console.log("auth change callback fired. TODO: check for redirects and init the page");
	// 	console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
	// 	rhit.checkForRedirects();

	// 	rhit.initializePage();
	// });

	const authAndDataChangeCallback = () => {
		rhit.fbUsersManager = new rhit.FbUsersManager();
        console.log("auth change callback fired. TODO: check for redirects and init the page");
        console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);

        // Check for redirects and initialize the page
        rhit.checkForRedirects();
        rhit.initializePage();
    };

    // Begin listening on both managers
    rhit.fbAuthManager.beginListening(authAndDataChangeCallback);
    // rhit.fbUsersManager.beginListening(authAndDataChangeCallback);
};

rhit.main();