import models from "@models";
import bcrypt from "bcryptjs";

async function seedDevPassword() {
  const email = "teacher@dev.local";
  const plainPassword = "123456";
  const hashed = await bcrypt.hash(plainPassword, 10);

  const user = await models.user.findFirst({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // ✅ Tìm password hiện có
  const existingPassword = await models.password.findFirst({
    where: {
      userId: user.id,
      type: "PASSWORD",
    },
  });

  if (existingPassword) {
    // ✅ Update nếu đã tồn tại
    await models.password.update({
      where: { id: existingPassword.id },
      data: {
        password: hashed,
      },
    });
  } else {
    // ✅ Create nếu chưa có
    await models.password.create({
      data: {
        userId: user.id,
        type: "PASSWORD",
        password: hashed,
      },
    });
  }

  console.log("✅ DEV password seeded for", email);
}

seedDevPassword()
  .catch(console.error)
  .finally(() => models.$disconnect());