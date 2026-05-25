import { ObjectId } from "mongodb";
import { getDb } from "@/app/mongodb";
import type { Builder } from "@/app/builders";

type BuilderDocument = Omit<Builder, "_id">;

//this function takes the MongoDB builder document, convert its _id from ObjectId into a normal string, then return it to the app.
function serializeBuilder(builder: BuilderDocument & { _id: ObjectId }): Builder {
    return {
        ...builder,
        _id: builder._id.toString(),
    };
}

export async function getBuilders() {
    const db = await getDb();
    const builders = await db
        .collection<BuilderDocument>("builders")
        .find()
        .toArray();

    return builders.map(serializeBuilder);
}

export async function getBuilderById(id: string) {
    const db = await getDb();
    
    if (!ObjectId.isValid(id)) {
        return null
    }

    const builder = await db
        .collection<BuilderDocument>("builders")
        .findOne({ _id: new ObjectId(id) });

    return builder ? serializeBuilder(builder) : null;
}
