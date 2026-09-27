import { config } from "dotenv";
import mongoose from "mongoose";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

config({
  path: resolve(dirname(fileURLToPath(import.meta.url)), "../config/config.env"),
});

const atlasUri = process.env.ATLAS_URI;
const localUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017";
if (!atlasUri) {
  throw new Error("Set ATLAS_URI in the terminal before running this script.");
}

const localConnection = await mongoose.createConnection(
  localUri,
  { dbName: "LMS" }
).asPromise();
const atlasConnection = await mongoose.createConnection(
  atlasUri,
  { dbName: "LMS" }
).asPromise();

try {
  const localUsers = localConnection.db.collection("users");
  const atlasUsers = atlasConnection.db.collection("users");
  const admin = await localUsers.findOne({
    role: "Admin",
    accountVerified: true,
  });

  if (!admin) {
    throw new Error("No verified local admin was found.");
  }

  const existingUser = await atlasUsers.findOne({ email: admin.email });
  if (existingUser) {
    await atlasUsers.updateOne(
      { _id: existingUser._id },
      {
        $set: {
          name: admin.name,
          password: admin.password,
          role: "Admin",
          accountVerified: true,
        },
      }
    );
    console.log(`Updated Atlas admin: ${admin.email}`);
  } else {
    await atlasUsers.insertOne(admin);
    console.log(`Copied admin to Atlas: ${admin.email}`);
  }
} finally {
  await Promise.all([localConnection.close(), atlasConnection.close()]);
}
