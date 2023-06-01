import mongoose from "mongoose";

export const connnectDB = async () => {
  // We can use that or we can use "Try Catch Blook"
  // const { connection } = await mongoose.connect(process.env.MONGO_URI);

  // console.log(`MongoDB connected on: ${connection.host}`);

  // Try catch

  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected on: ${connection.host}`);
  } catch (error) {
    console.log(error, "Ohh No! an error occured to connecting with database");
  }
};
