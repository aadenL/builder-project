import { ObjectId } from "mongodb";
import { getDb } from "@/app/mongodb";

export type Builder = {
    _id: string;
    developer: string;
    name: string;
    location: string;
    address: string;
    type: string;
    conStatus: string;
    ceilings: string;
    deposit: string;
    price: number;
    beds: number;
    baths: number;
    garage: number;
    sqft: number;
    desc: string;
    listStatus: string;
    img: string;
    features: string[];
};

//creates a new type based on Builder, but without _id
//does this because the app wants _id as a string, but mongoDB stores _id as an ObjectId
type BuilderDocument = Omit<Builder, "_id">;

//this function takes the MongoDB builder document, convert its _id from ObjectId into a normal string, then return it to the app.
function serializeBuilder(builder: BuilderDocument & { _id: ObjectId }): Builder {
    return {
        //copies all fields from the mongoDb document into the new object
        ...builder,
        //overrides _id and turns it into a string since the app is asking for a string
        _id: builder._id.toString(),
    };
}

//returns all builders
export async function getBuilders() {
    const db = await getDb();
    const builders = await db
        //selects the MongoDB collection named builders, <BuilderDocument> tells TypeScript what kind of docs are in the collection
        .collection<BuilderDocument>("builders")
        //finds all the docs in the collectuin
        .find()
        //turns the result retrieved from MongoDB into a normal js array
        .toArray();

    //loops through every builder and converts each one from ObjectId to a string
    return builders.map(serializeBuilder);
}

//returns builder by id
export async function getBuilderById(id: string) {
    //gets the database
    const db = await getDb();
    
    //checks if the string is a valid MongoDb ObjectId
    if (!ObjectId.isValid(id)) {
        return null
    }

    const builder = await db
        .collection<BuilderDocument>("builders")

        //finds the one doc (builder) in the MongoDb database that the _id matches the id
        .findOne({ _id: new ObjectId(id) });

    //if MongoDB finds a builder, convert it into app format and return it, else return null
    return builder ? serializeBuilder(builder) : null;
}
