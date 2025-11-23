import { db } from "@/../firebaseConfig";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	addDoc,
} from "firebase/firestore";
import { Batch } from "@/types";
import { sanitizeForFirestore, convertTimestamp } from "@/lib/firestore-utils";
import { firestoreToBatch } from "@/helpers/firestore_helper_functions/batches/firestoreDocumentToBatchConverter";
import { updateProductPrice } from "@/helpers/firestore_helper_functions/products/updateProductPrice";

const BATCHES_COLLECTION = "BATCHES";

export const batchService = {
	
	
};

export default batchService;
