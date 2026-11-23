// Firestore security rules tests (firestore.rules).
// Run with `npm run test:rules`: firebase emulators:exec starts the Firestore emulator (demo project),
// sets FIRESTORE_EMULATOR_HOST and GCLOUD_PROJECT, then runs jest.
const fs = require("node:fs");
const path = require("node:path");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { setLogLevel } = require("firebase/firestore");

// Denied requests are the expected outcome of most tests: don't let the SDK log a warning for each of them.
setLogLevel("error");

const NOBODY = { roles: { admin: false, member: false } };
const MEMBER = { roles: { admin: false, member: true } };
const ADMIN = { roles: { admin: true, member: false } };

let testEnv;

// Contexts (users are seeded in seed())
const anon = () => testEnv.unauthenticatedContext().firestore();
const asUser = (uid) => testEnv.authenticatedContext(uid).firestore();
const asAdmin = () => asUser("admin1");
const asMember = () => asUser("member1");
const asVisitor = () => asUser("user1"); // authenticated, no role
const asNoProfile = () => asUser("ghost"); // authenticated, but has no users/{uid} document

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      db.doc("users/admin1").set({ pseudo: "Admin", ...ADMIN }),
      db.doc("users/member1").set({ pseudo: "Member", ...MEMBER }),
      db.doc("users/user1").set({ pseudo: "User1", ...NOBODY }),
      db.doc("users/user2").set({ pseudo: "User2", ...NOBODY }),
      db.doc("events/e1").set({ title: "Event" }),
      db.doc("news/n1").set({ title: "News" }),
      db.doc("stores/s1").set({ name: "Store" }),
      db.doc("config_home/home").set({ title: "Home" }),
      db.doc("config_asso/asso").set({ title: "Asso" }),
      db.doc("league_scores/l1").set({ points: 10 }),
      db.doc("pending_memberships/a@example.com").set({ email: "a@example.com" }),
      db.doc("registrations/r1").set({ userId: "user1", eventId: "e1" }),
    ]);
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: process.env.GCLOUD_PROJECT,
    firestore: { rules: fs.readFileSync(path.join(__dirname, "../../firestore.rules"), "utf8") },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seed();
});

describe("default deny", () => {
  test("collections without a rule are closed, even to admins", async () => {
    await assertFails(anon().doc("secret/doc").get());
    await assertFails(asAdmin().doc("secret/doc").get());
    await assertFails(asAdmin().doc("secret/doc").set({ a: 1 }));
  });
});

describe("users", () => {
  test("anyone can read profiles (pseudos are shown in participant lists)", async () => {
    await assertSucceeds(anon().doc("users/user1").get());
    await assertSucceeds(asVisitor().doc("users/admin1").get());
  });

  describe("create", () => {
    test("a user can create their own profile without roles", async () => {
      await assertSucceeds(asUser("newbie").doc("users/newbie").set({ pseudo: "New" }));
    });

    test("a user can create their own profile with all roles false", async () => {
      await assertSucceeds(asUser("newbie").doc("users/newbie").set({ pseudo: "New", ...NOBODY }));
    });

    test("a user cannot self-assign admin or member", async () => {
      await assertFails(asUser("newbie").doc("users/newbie").set({ pseudo: "New", ...ADMIN }));
      await assertFails(asUser("newbie").doc("users/newbie").set({ pseudo: "New", ...MEMBER }));
    });

    test("a user cannot create a profile for someone else", async () => {
      await assertFails(asUser("newbie").doc("users/other").set({ pseudo: "Other" }));
    });

    test("an anonymous visitor cannot create a profile", async () => {
      await assertFails(anon().doc("users/newbie").set({ pseudo: "New" }));
    });
  });

  describe("update", () => {
    test("a user can edit their own pseudo", async () => {
      await assertSucceeds(asVisitor().doc("users/user1").update({ pseudo: "Renamed" }));
    });

    test("a user cannot touch their own roles", async () => {
      await assertFails(asVisitor().doc("users/user1").update({ roles: ADMIN.roles }));
      await assertFails(asVisitor().doc("users/user1").update({ "roles.admin": true }));
      await assertFails(asMember().doc("users/member1").update({ "roles.admin": true }));
    });

    test("a user cannot edit someone else's profile", async () => {
      await assertFails(asVisitor().doc("users/user2").update({ pseudo: "Hacked" }));
      await assertFails(asMember().doc("users/user2").update({ pseudo: "Hacked" }));
    });

    test("an admin can edit any profile, including roles", async () => {
      await assertSucceeds(asAdmin().doc("users/user2").update({ pseudo: "Renamed" }));
      await assertSucceeds(asAdmin().doc("users/user2").update({ roles: MEMBER.roles }));
    });

    test("an anonymous visitor cannot edit a profile", async () => {
      await assertFails(anon().doc("users/user1").update({ pseudo: "Hacked" }));
    });
  });

  describe("delete", () => {
    test("only an admin can delete a profile", async () => {
      await assertFails(anon().doc("users/user2").delete());
      await assertFails(asVisitor().doc("users/user1").delete());
      await assertFails(asMember().doc("users/user2").delete());
      await assertSucceeds(asAdmin().doc("users/user2").delete());
    });
  });
});

describe("admin role", () => {
  test("an authenticated user without a profile document is not an admin", async () => {
    await assertFails(asNoProfile().doc("events/new").set({ title: "Nope" }));
  });

  test("the member role does not grant write access", async () => {
    await assertFails(asMember().doc("events/new").set({ title: "Nope" }));
  });
});

// Public read, admin-only write
describe.each(["events/e1", "news/n1", "stores/s1", "config_home/home", "config_asso/asso", "league_scores/l1"])(
  "public content %s",
  (docPath) => {
    const [collection] = docPath.split("/");

    test("anyone can read it", async () => {
      await assertSucceeds(anon().doc(docPath).get());
      await assertSucceeds(asVisitor().doc(docPath).get());
    });

    test("anonymous visitors, visitors and members cannot write, update or delete it", async () => {
      for (const db of [anon(), asVisitor(), asMember()]) {
        await assertFails(db.doc(`${collection}/new`).set({ a: 1 }));
        await assertFails(db.doc(docPath).update({ a: 1 }));
        await assertFails(db.doc(docPath).delete());
      }
    });

    test("an admin can create, update and delete it", async () => {
      const db = asAdmin();
      await assertSucceeds(db.doc(`${collection}/new`).set({ a: 1 }));
      await assertSucceeds(db.doc(docPath).update({ a: 2 }));
      await assertSucceeds(db.doc(docPath).delete());
    });
  }
);

describe("pending_memberships", () => {
  const docPath = "pending_memberships/a@example.com";

  test("only an admin can read it", async () => {
    await assertFails(anon().doc(docPath).get());
    await assertFails(asVisitor().doc(docPath).get());
    await assertFails(asMember().doc(docPath).get());
    await assertSucceeds(asAdmin().doc(docPath).get());
  });

  test("only an admin can write it", async () => {
    await assertFails(anon().doc("pending_memberships/b@example.com").set({ a: 1 }));
    await assertFails(asVisitor().doc("pending_memberships/b@example.com").set({ a: 1 }));
    await assertFails(asMember().doc(docPath).delete());
    await assertSucceeds(asAdmin().doc("pending_memberships/b@example.com").set({ a: 1 }));
    await assertSucceeds(asAdmin().doc(docPath).delete());
  });
});

describe("registrations", () => {
  test("anyone can read registrations", async () => {
    await assertSucceeds(anon().doc("registrations/r1").get());
  });

  describe("create", () => {
    test("a user can register themselves", async () => {
      await assertSucceeds(asUser("user2").doc("registrations/r2").set({ userId: "user2", eventId: "e1" }));
    });

    test("a user cannot register someone else", async () => {
      await assertFails(asUser("user2").doc("registrations/r2").set({ userId: "user1", eventId: "e1" }));
    });

    test("a registration without a userId is refused", async () => {
      await assertFails(asUser("user2").doc("registrations/r2").set({ eventId: "e1" }));
    });

    test("an anonymous visitor cannot register", async () => {
      await assertFails(anon().doc("registrations/r2").set({ userId: "user2", eventId: "e1" }));
    });

    test("an admin can register anyone", async () => {
      await assertSucceeds(asAdmin().doc("registrations/r2").set({ userId: "user2", eventId: "e1" }));
    });
  });

  describe("update", () => {
    test("the owner can update their registration", async () => {
      await assertSucceeds(asVisitor().doc("registrations/r1").update({ guests: 1 }));
    });

    test("an admin can update any registration", async () => {
      await assertSucceeds(asAdmin().doc("registrations/r1").update({ guests: 1 }));
    });

    test("an anonymous visitor cannot update a registration", async () => {
      await assertFails(anon().doc("registrations/r1").update({ guests: 1 }));
    });

    test("a user cannot take over another user's registration", async () => {
      await assertFails(asUser("user2").doc("registrations/r1").update({ userId: "user2" }));
    });

    test("a user cannot overwrite another user's registration", async () => {
      await assertFails(asUser("user2").doc("registrations/r1").set({ userId: "user2", eventId: "e1" }));
    });

    test("a user cannot hand their registration over to someone else", async () => {
      await assertFails(asVisitor().doc("registrations/r1").update({ userId: "user2" }));
    });
  });

  describe("delete", () => {
    test("the owner can cancel their registration", async () => {
      await assertSucceeds(asVisitor().doc("registrations/r1").delete());
    });

    test("another user cannot cancel it", async () => {
      await assertFails(asUser("user2").doc("registrations/r1").delete());
      await assertFails(asMember().doc("registrations/r1").delete());
      await assertFails(anon().doc("registrations/r1").delete());
    });

    test("an admin can delete any registration", async () => {
      await assertSucceeds(asAdmin().doc("registrations/r1").delete());
    });
  });
});
