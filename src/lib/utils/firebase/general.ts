// import { collection, , getDocs, doc, setDoc } from 'firebase/firestore';
import { 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    getDoc, 
    getDocs, 
    limit, 
    query, 
    where, 
    deleteDoc 
} from "firebase/firestore";

import { db } from '../../constants/firebase/config'


export async function uploadData(collectionName: string, data: any): Promise<boolean> {
    let uploaded = false
    try {
        // TODO: if id then use it as docID
        const docRef = await addDoc(collection(db, collectionName), data);
        // console.log("Document written with ID: ", docRef.id);
        uploaded = true
    } catch (e) {
        // TODO: properly handle errors
        console.error("Error adding document: ", e);
    }

    return uploaded
}



/**
 * Deletes a document from a specified collection in Firestore.
 * @param {string} collectionName - The name of the collection.
 * @param {string} documentId - The ID of the document to delete.
 * @returns {Promise<{ success: boolean, error?: string }>} - Result of the deletion operation.
 */
export async function deleteData(
    collectionName: string,
    documentId: string | number
): Promise<{ success: boolean, error?: string }> {
    // Validate inputs
    if (!collectionName || !documentId) {
        console.error("Collection name or document ID is missing.");
        return { success: false, error: "Invalid collection name or document ID." };
    }

    try {
        // Get a reference to the document
        const docRef = doc(db, collectionName, `${documentId}`);

        // Delete the document
        await deleteDoc(docRef);
        console.log(`Document with ID "${documentId}" successfully deleted from collection "${collectionName}".`);

        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred.",
        };
    }
}


export async function fetchData(collectionName:string, count?:number) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    let data: any[] = [] //

    if (count) {
        // Speficify a count to the number of documents to fetch
        const limitedQuery = query(collection(db, collectionName), limit(count));
        const limitedSnapshot = await getDocs(limitedQuery);
        limitedSnapshot.forEach((doc) => {
            data.push(doc.data());
        });
    } else {
        querySnapshot.forEach((doc) => {
            // doc.data() is never undefined for query doc snapshots
            // console.log(doc.id, " => ", doc.data());
            data.push(doc.data())
        });
    }
   return data
}



export async function setDetails(item: any, collectionName: string, id: string | number) {
    if (!collectionName || !id) {
        console.error("Collection name or document ID is missing.");
        return { success: false, error: "Invalid collection name or document ID." };
    }

    try {
        // Ensure the collectionName and id together create a valid document path.
        const docRef = doc(db, collectionName, `${id}`);
        await setDoc(docRef, item);

        return { success: true, id };
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error setting document: ", error.message);
            return { success: false, error: error.message };
        } else {
            console.error("Unknown error setting document: ", error);
            return { success: false, error: "Unknown error occurred." };
        }
    }
}

export async function setDetailsOfMany(items: any[], collectionName: string) {
    let success = true;
    let errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const id = item.id;
        const result = await setDetails(item, collectionName, id);

        if (!result.success) {
            success = false;
            errors.push(result.error || "Unknown error occurred.");
        }
    }

    return { success, errors };
}


export async function getOne(id: string | number, collectionName: string) {
    // get one doc from the specified collection
    try {
        const docRef = doc(db, collectionName, `${id}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            throw new Error("No such document!");
        }
    } catch (error) {
        console.error("Error getting document:", error);
        throw error;
    }
}

export async function getLimitedMany(limitNumber: number, collectionName: string) {
    // get a limited number of docs from the specified collection
    try {
        const q = query(collection(db, collectionName), limit(limitNumber));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => doc.data());
        return docs;
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}

export async function getAll(collectionName: string) {
    // get all docs from the specified collection
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const docs = querySnapshot.docs.map(doc => doc.data());
        return docs;
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}

export async function getAllWhereEquals(collectionName: string, attributeName: string, value: any) {
    // get all docs from the specified collection where attribute equals value
    try {
        const q = query(collection(db, collectionName), where(attributeName, "==", value));
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => doc.data());
        return docs;
    } catch (error) {
        console.error("Error getting documents:", error);
        throw error;
    }
}