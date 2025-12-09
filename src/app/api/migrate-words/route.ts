import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/../firebaseConfig";
import { generateWordsArray } from "@/lib/firestore-utils";

const PRODUCTS_COLLECTION = "PRODUCTS";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting words array migration...");

    // Get all products
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);

    console.log(`Found ${snapshot.docs.length} products to process`);

    let processed = 0;
    let updated = 0;
    const batchSize = 500; // Firestore batch limit
    let batch = writeBatch(db);
    let batchCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const productId = docSnap.id;

      // Check if words array exists and is valid
      const currentWords = data.info?.words;
      const productName = data.info?.name;

      if (!productName) {
        console.log(`Skipping product ${productId}: no name`);
        continue;
      }

      const expectedWords = generateWordsArray(productName);

      // If words array doesn't exist or is different, update it
      if (!currentWords || JSON.stringify(currentWords.sort()) !== JSON.stringify(expectedWords.sort())) {
        const docRef = doc(db, PRODUCTS_COLLECTION, productId);

        batch.update(docRef, {
          "info.words": expectedWords,
          "info.nameLower": productName.toLowerCase(), // Also ensure nameLower is correct
        });

        updated++;
        batchCount++;

        // Commit batch when it reaches the limit
        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      processed++;

      // Log progress every 100 products
      if (processed % 100 === 0) {
        console.log(`Processed ${processed}/${snapshot.docs.length} products`);
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }

    console.log(`Migration completed: ${processed} processed, ${updated} updated`);

    return NextResponse.json({
      success: true,
      message: `Migration completed: ${processed} products processed, ${updated} products updated with words arrays`,
      stats: {
        total: snapshot.docs.length,
        processed,
        updated
      }
    });

  } catch (error) {
    console.error("Error during words migration:", error);
    return NextResponse.json(
      { error: "Migration failed", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}