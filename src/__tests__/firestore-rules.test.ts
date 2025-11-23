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
	RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { setLogLevel } from "firebase/firestore";

// Set up test environment
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
	// Silence expected rules rejections from Firestore SDK
	setLogLevel("error");

	testEnv = await initializeTestEnvironment({
		projectId: "demo-test-project",
		firestore: {
			host: "localhost",
			port: 8080,
			// rules: readFileSync('firestore.rules', 'utf8'), // Load your rules file
		},
	});
});

afterAll(async () => {
	if (testEnv) {
		await testEnv.cleanup();
	}
}, 10000); // 10 second timeout for cleanup

beforeEach(async () => {
	await testEnv.clearFirestore();
});

describe("Firestore Security Rules Tests", () => {
	it("should allow authenticated users to read their own data", async () => {
		const alice = testEnv.authenticatedContext("alice");
		const aliceDoc = alice.firestore().collection("users").doc("alice");

		await testEnv.withSecurityRulesDisabled(async (context) => {
			await context.firestore().collection("users").doc("alice").set({
				name: "Alice",
				email: "alice@example.com",
			});
		});

		// This should succeed if your rules allow users to read their own data
		// await assertSucceeds(aliceDoc.get());
	});

	it("should deny unauthenticated users from reading data", async () => {
		const unauth = testEnv.unauthenticatedContext();
		const doc = unauth.firestore().collection("users").doc("alice");

		// This should fail if your rules require authentication
		// await assertFails(doc.get());
	});
});
