/**
 * Example Firebase Firestore Rules Unit Test
 *
 * This test demonstrates how to test Firestore security rules
 * using @firebase/rules-unit-testing
 *
 * To run: npm test
 */

import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
	type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setLogLevel } from "firebase/firestore";
const { readFileSync } = require("fs");
const {
	doc,
	getDoc,
	setDoc,
	updateDoc,
	Timestamp,
	deleteDoc,
	arrayUnion,
	arrayRemove,
	addDoc,
} = require("firebase/firestore");

// Set up test environment
let firebaseEnv: RulesTestEnvironment;

beforeAll(async () => {
	// Silence expected rules rejections from Firestore SDK
	setLogLevel("error");

	firebaseEnv = await initializeTestEnvironment({
		projectId: "e-commerce-14d5c",
		firestore: {
			host: "localhost",
			port: 8080,
			rules: readFileSync("D:\\firebase\\firestore.rules", "utf8"), // Load your rules file
		},
	});
});

afterAll(async () => {
	if (firebaseEnv) {
		await firebaseEnv.cleanup();
	}
}, 10000); // 10 second timeout for cleanup

beforeEach(async () => {
	await firebaseEnv.clearFirestore();
});

describe("PRODUCTS", () => {
	it("should allow All users to read from PRODUCTS (1)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "customer" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertSucceeds(getDoc(doc(firestore, userRef)));
	});

	it("should allow All users to read from PRODUCTS (2)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "customer" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertSucceeds(getDoc(doc(firestore, userRef)));
	});

	it("should allow only Admin to create a PRODUCT (1)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "customer" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertFails(
			setDoc(doc(firestore, userRef), {
				id: "50Ma6fnMfxvEiGyeZcA7",
				info: {
					name: "Sample Product",
					isActive: true,
				},
			})
		);
	});

	it("should allow only Admin to create a PRODUCT (2)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "admin" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertSucceeds(
			setDoc(doc(firestore, userRef), {
				id: "50Ma6fnMfxvEiGyeZcA7",
				info: {
					name: "Sample Product",
					isActive: true,
				},
			})
		);
	});

	it("should allow to create a PRODUCT only if data is valid (1)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "admin" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertFails(
			setDoc(doc(firestore, userRef), {
				id: "",
				info: {
					name: "Sample Product",
					isActive: true,
				},
			})
		);
	});

	it("should allow to create a PRODUCT only if data is valid (2)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "admin" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertFails(
			setDoc(doc(firestore, userRef), {
				id: 1,
				info: {
					name: "Sample Product",
					isActive: true,
				},
			})
		);
	});

	it("should allow to create a PRODUCT only if data is valid (3)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "admin" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertFails(
			setDoc(doc(firestore, userRef), {
				id: "50Ma6fnMfxvEiGyeZcA7",
				info: "This should be a map, not a string",
			})
		);
	});

	it("should allow to create a PRODUCT only if data is valid (4)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "admin" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertFails(
			setDoc(doc(firestore, userRef), {
				id: "50Ma6fnMfxvEiGyeZcA7",
				info: {
					name: "", // name should be non-empty
					isActive: true,
				},
			})
		);
	});

	it("should allow to create a PRODUCT only if data is valid (5)", async () => {
		const authContext = firebaseEnv.authenticatedContext(
			"ISCGKGSCHVCHGKAEVHDJCVD",
			{ role: "admin" }
		);
		const firestore = authContext.firestore();
		const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

		await assertFails(
			setDoc(doc(firestore, userRef), {
				id: "50Ma6fnMfxvEiGyeZcA7",
				info: {
					name: "Sample Product",
					isActive: 100, // should be bool
				},
			})
		);
	});
	// it("should NOT allow Un-authenticated TUTORS to read TUTORS", async () => {
	// 	const unauthContext = firebaseEnv.unauthenticatedContext();
	// 	const firestore = unauthContext.firestore();
	// 	const userRef = "PRODUCTS/50Ma6fnMfxvEiGyeZcA7";

	// 	await assertFails(getDoc(doc(firestore, userRef)));
	// });

	// it("should allow Authenticated TUTORS to write TUTORS", async () => {
	// 	const authContext = firebaseEnv.authenticatedContext(
	// 		"ISCGKGSCHVCHGKAEVHDJCVD",
	// 		{ role: "tutor" }
	// 	);
	// 	const firestore = authContext.firestore();
	// 	const userRef = "TUTORS/ISCGKGSCHVCHGKAEVHDJCVD";

	// 	await assertSucceeds(
	// 		setDoc(doc(firestore, userRef), {
	// 			username: "John Doe",
	// 			uid: "ISCGKGSCHVCHGKAEVHDJCVD",
	// 			email: "John.Doe@gmail.com",
	// 			total_students: 0,
	// 			active_students: 0,
	// 			completed_lessons: 0,
	// 			pending_lessons: 0,
	// 			total_reviews: 0,
	// 			rating: 0,
	// 			profilePhotoURL: "",
	// 			per_lesson_rate: 0,
	// 			free_trail_lesson_enable: true,
	// 			country: "",
	// 			languages: [],
	// 			categories: [],
	// 			number_of_reviews: 0,
	// 			tagline: "",
	// 			about: "",
	// 			experience_years: 0,
	// 			plan_type: "trial",
	// 			subscription_status: "active",
	// 			pending_categories: [],
	// 		})
	// 	);
	// });
});
